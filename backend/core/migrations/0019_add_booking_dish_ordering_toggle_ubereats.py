from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_announcement_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='preselected_dish',
            field=models.CharField(blank=True, default='', help_text='Optional favourite menu item pre-selected by guest', max_length=120),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='uber_eats_url',
            field=models.CharField(blank=True, default='https://www.ubereats.com', help_text='Link to Uber Eats store', max_length=300),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='online_ordering_enabled',
            field=models.BooleanField(default=True, help_text='Turn online takeaway ordering on/off from admin panel'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='online_ordering_disabled_message',
            field=models.CharField(blank=True, default='Online ordering is temporarily paused. Please visit us or call to place an order.', help_text='Notice shown to guests when online ordering is paused', max_length=250),
        ),
    ]
