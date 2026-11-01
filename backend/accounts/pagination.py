from rest_framework.pagination import PageNumberPagination


class StudentPagination(PageNumberPagination):
    """
    Standard pagination for admin student listings.
    Default page size is 10, configurable up to 100 via 'page_size' query parameter.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
