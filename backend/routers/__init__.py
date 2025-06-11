from .auth import router as auth_router
from .user_profile import router as user_profile_router
from .preferences import router as preferences_router
from .training_traits import router as training_traits_router
from .pets import router as pets_router
from .pet_training_traits import router as pet_training_traits_router
from .matching import router as matching_router
from .visit_requests import router as visit_requests_router
from .admin_visit_requests import router as admin_visit_requests_router

__all__ = [
    "auth_router",
    "user_profile_router",
    "preferences_router",
    "training_traits_router",
    "pets_router",
    "pet_training_traits_router",
    "matching_router",
    "visit_requests_router",
    "admin_visit_requests_router",
]
