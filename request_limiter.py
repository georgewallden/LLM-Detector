# request_limiter.py
import threading

class RequestLimiter:
    """
    A simple, thread-safe counter to limit the number of requests.
    It has no power to shut down the server, only to report its state.
    """
    def __init__(self, max_requests: int):
        self.max_requests = max_requests
        self.request_count = 0
        self.lock = threading.Lock()
        print(f"--- RequestLimiter initialized with a limit of {max_requests} requests. ---")

    def increment_and_check(self) -> bool:
        """
        Increments the request count and checks if the limit has been exceeded.
        Returns True if the request is allowed, False otherwise.
        This should be called when an action is being performed.
        """
        with self.lock:
            if self.request_count < self.max_requests:
                self.request_count += 1
                print(f"--- RequestLimiter: Count is now {self.request_count}/{self.max_requests} ---")
                return True # Request is allowed
            else:
                print(f"--- RequestLimiter: Limit of {self.max_requests} reached. Blocking request. ---")
                return False # Request is blocked

    def is_limit_reached(self) -> bool:
        """
        Checks if the request limit has been reached without incrementing the count.
        Returns True if the limit has been reached, False otherwise.
        This should be used for status checks, like in middleware.
        """
        with self.lock:
            return self.request_count >= self.max_requests