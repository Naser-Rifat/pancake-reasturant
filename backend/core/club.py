import re
from django.utils import timezone
from rest_framework import filters, mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import ClubMember


class ClubRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=254)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    privacy_consent = serializers.BooleanField()
    marketing_consent = serializers.BooleanField(default=False)
    website = serializers.CharField(required=False, allow_blank=True, max_length=200)

    def validate_name(self, value):
        val = value.strip()
        if len(val) < 2:
            raise serializers.ValidationError("Please provide your name (at least 2 characters).")
        if not re.search(r"[a-zA-Z\u00C0-\u017F]", val):
            raise serializers.ValidationError("Name must contain letters.")
        return val

    def validate_phone(self, value):
        if not value:
            return ""
        val = value.strip()
        if not val:
            return ""
        if not re.match(r"^[+]?[\d\s\-().]+$", val):
            raise serializers.ValidationError("Phone number can only contain digits, spaces, and '+' for country code.")
        if val.count("+") > 1 or (val.find("+") > 0):
            raise serializers.ValidationError("Country code '+' must be at the beginning.")
        digits = re.sub(r"\D", "", val)
        if len(digits) < 8:
            raise serializers.ValidationError("Phone number is too short (minimum 8 digits).")
        if len(digits) > 15:
            raise serializers.ValidationError("Phone number is too long (maximum 15 digits).")
        if val.startswith("+") and digits.startswith("0"):
            raise serializers.ValidationError("Country code cannot start with 0.")
        return val

    def validate_privacy_consent(self, value):
        if not value:
            raise serializers.ValidationError("Please agree to the privacy notice to join.")
        return value

    def validate_email(self, value):
        return value.strip().lower()


class ClubRegistrationView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "club"

    def post(self, request):
        serializer = ClubRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        # Quietly ignore the honeypot. Duplicates get the same response, never
        # reveal a membership record, and cannot overwrite an existing opt-out.
        if not data.get("website"):
            now = timezone.now()
            member, created = ClubMember.objects.get_or_create(
                email=data["email"],
                defaults={
                    "name": data["name"],
                    "phone": data.get("phone", "").strip(),
                    "privacy_accepted_at": now,
                    "marketing_consent": data["marketing_consent"],
                    "marketing_consented_at": now if data["marketing_consent"] else None,
                },
            )
            if created:
                from . import emails

                emails.club_welcome(member)
        return Response(
            {"detail": "Thanks for joining! If your email is already registered, we've kept your existing preferences."},
            status=status.HTTP_202_ACCEPTED,
        )


class ClubMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubMember
        fields = ["id", "name", "email", "phone", "status", "marketing_consent",
                  "marketing_consented_at", "privacy_accepted_at", "consent_version", "created_at"]
        # Staff may archive registrations, not manufacture consent or identities.
        read_only_fields = [field for field in fields if field != "status"]


class ClubPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class AdminClubMemberViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin,
                             mixins.DestroyModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ClubMemberSerializer
    pagination_class = ClubPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "email", "phone"]
    http_method_names = ["get", "patch", "post", "delete", "head", "options"]

    def get_queryset(self):
        queryset = ClubMember.objects.all()
        member_status = self.request.query_params.get("status")
        if member_status in ClubMember.Status.values:
            queryset = queryset.filter(status=member_status)
        consent = self.request.query_params.get("consent")
        if consent in ("true", "1"):
            queryset = queryset.filter(marketing_consent=True)
        elif consent in ("false", "0"):
            queryset = queryset.filter(marketing_consent=False)
        return queryset

    @action(detail=False, methods=["get"])
    def stats(self, request):
        total = ClubMember.objects.count()
        active = ClubMember.objects.filter(status=ClubMember.Status.ACTIVE).count()
        consented = ClubMember.objects.filter(marketing_consent=True).count()
        return Response({
            "total": total,
            "active": active,
            "archived": total - active,
            "consented": consented,
        })

    @action(detail=True, methods=["post"], url_path="revoke-consent")
    def revoke_consent(self, request, pk=None):
        member = self.get_object()
        member.marketing_consent = False
        # Retain the original timestamp as an audit of the submitted consent.
        member.save(update_fields=["marketing_consent", "updated_at"])
        return Response(self.get_serializer(member).data)
