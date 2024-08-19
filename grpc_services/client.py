# client.py
import grpc
import user_service_pb2
import user_service_pb2_grpc

def run():
    with grpc.insecure_channel('localhost:10000') as channel:
        stub = user_service_pb2_grpc.UserServiceStub(channel)
        response = stub.CreateUser(user_service_pb2.CreateUserRequest(
            name='John Doe',
            email='john.doe@example.com',
            age=30,
            phoneNumber='+1234567890',
            address='123 Main St',
            role='user',
            referralCode='ABC12345',
            token='your-token'  # Добавьте токен, если он требуется
        ))
        print("User created:", response)

if __name__ == '__main__':
    run()
