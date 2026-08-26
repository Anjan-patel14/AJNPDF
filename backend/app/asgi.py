from .main import app
from .billing_routes import router as billing_router

app.include_router(billing_router)
