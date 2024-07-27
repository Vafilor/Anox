import pytest
from timetracker.models import User


@pytest.fixture
def user():
    return User(username="test")
