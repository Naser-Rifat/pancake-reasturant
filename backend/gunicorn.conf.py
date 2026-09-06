# Picked up automatically by gunicorn from the working directory — this is the
# only reliable way to set workers here, because the Railway service has a
# dashboard-level start command that strips CLI flags.
workers = 3
threads = 4
timeout = 60
