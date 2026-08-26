# AJN PDF FastAPI Conversion Service

The backend provides temporary PDF security, image, office-document, eBook, email and XPS conversions.

## Main endpoints

- `GET /health`
- `GET /ready`
- `GET /api/tools`
- `POST /api/convert/{tool_id}`
- `POST /api/pdf/protect`
- `POST /api/pdf/unlock`
- `POST /api/pdf/repair`
- `POST /api/pdf/compress`
- `GET /api/admin/analytics` with `X-AJN-Admin-Token`
- `GET /api/public/posts` and `GET /api/public/posts/{slug}`
- `POST /api/admin/posts` and `DELETE /api/admin/posts/{id}` with `X-AJN-Admin-Token`
- `GET /media/{generated-image}`

Files are processed in unique temporary directories and removed after the response. Anonymous analytics exclude filenames, document contents and IP addresses. Public image publishing stores optimized WebP files, descriptive metadata and no original upload filename.

Use the project-level `SETUP_FULL_PRODUCTION.ps1` for Windows or build `backend/Dockerfile` for production.
