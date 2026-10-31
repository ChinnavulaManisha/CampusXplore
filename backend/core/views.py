from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
def health_check(request):
    """
    Basic health check endpoint returning system status.
    """
    return Response(
        {
            "status": "ok",
            "message": "CampusXplore backend is running"
        },
        status=status.HTTP_200_OK
    )
