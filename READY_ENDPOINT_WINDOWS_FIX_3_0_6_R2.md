# AJN PDF 3.0.6 R2 readiness endpoint fix

The 3.0.6 R1 readiness constructor expanded `HealthResponse.model_dump()` and also supplied `status` as a separate keyword. Because the dumped health payload already contains `status`, Python received the keyword twice and `/ready` returned HTTP 500.

R2 builds one merged mapping before constructing `ReadyResponse`, so the readiness status replaces the health status exactly once. The readiness checks themselves remain enabled: analytics/media SQLite integrity, media/temp writability, free disk, and conversion registry.

Windows setup must restart the 3.0.6 backend after applying this source fix so an already-running R1 process is not reused.
