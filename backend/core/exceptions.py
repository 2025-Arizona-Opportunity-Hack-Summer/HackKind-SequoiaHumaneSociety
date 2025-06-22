"""Custom exceptions for the application."""

class BaseAppException(Exception):
    """Base exception class for application-specific exceptions."""
    default_detail = "An error occurred."
    status_code = 400

    def __init__(self, detail: str = None, status_code: int = None):
        self.detail = detail or self.default_detail
        self.status_code = status_code or self.status_code
        super().__init__(self.detail)


class InvalidTokenError(BaseAppException):
    """Raised when a token is invalid or malformed."""
    default_detail = "Invalid token"
    status_code = 401


class TokenExpiredError(BaseAppException):
    """Raised when a token has expired."""
    default_detail = "Token has expired"
    status_code = 401


class AuthenticationError(BaseAppException):
    """Raised when authentication fails."""
    default_detail = "Authentication failed"
    status_code = 401


class PermissionDenied(BaseAppException):
    """Raised when a user doesn't have permission to access a resource."""
    default_detail = "You do not have permission to perform this action"
    status_code = 403


class BadRequest(BaseAppException):
    """Raised when invalid data is provided."""
    default_detail = "Invalid input"
    status_code = 400


class NotFound(BaseAppException):
    """Raised when a requested resource is not found."""
    default_detail = "Not found"
    status_code = 404


class Conflict(BaseAppException):
    """Raised when a resource already exists."""
    default_detail = "Resource already exists"
    status_code = 409
