# server.py
import sys
import os
import grpc
from concurrent import futures
import user_service_pb2_grpc
import user_service_pb2
import logging
from grpc_reflection.v1alpha import reflection

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

class UserService(user_service_pb2_grpc.UserServiceServicer):
    def CreateUser(self, request, context):
        response = user_service_pb2.CreateUserResponse(
            id="12345",
            name=request.name,
            email=request.email,
            age=request.age,
            phoneNumber=request.phoneNumber,
            address=request.address,
            role=request.role,
            referralCode=request.referralCode,
            status="Success"
        )
        return response

def serve():
    logging.basicConfig(level=logging.INFO)
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    user_service_pb2_grpc.add_UserServiceServicer_to_server(UserService(), server)

    SERVICE_NAMES = (
        user_service_pb2.DESCRIPTOR.services_by_name['UserService'].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    port = os.getenv('PORT', '10000')
    server.add_insecure_port(f'[::]:{port}')
    server.start()
    logging.info(f"Starting server on port {port}")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
