# Anox Server

The backend of the Anox, written in Django. Mostly a JSON API.

# Getting started

1. Make sure to have the following installed
  * Python - 3.12+
  * [Poetry](https://python-poetry.org/) for dependency management
  * Postgres for database. Local or docker works.
2. Create a Postgres database `anox`
3. Copy `.env.example` to `.env.local` and change any values needed
4. CD to `server` and run `poetry install`
5. Run migrations: `poetry run anox/manage.py migrate`
6. Run the server: `poetry run anox/manage.py runserver`
7. Create a superuser: `poetry run anox/manage.py createsuperuser`
  * Make sure to use a username longer than 6 characters


## Testing

[Pytest](https://docs.pytest.org/en/stable/) is used for testing, partially because its nice in VSCode.

To test
1. CD to `server`
2. Run poetry run pytest ./anox

## Dependency Management

* [Poetry](https://python-poetry.org/)

## Linters, formatters, etc

* [Black](https://black.readthedocs.io/en/stable/index.html)
* [flake8](https://flake8.pycqa.org/en/latest/)
  * config file: `.flake8`
* [iSort](https://pypi.org/project/isort/)
  * config file: `.isort.cfg`