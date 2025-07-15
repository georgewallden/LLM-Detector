# watchdog.py

import threading
import time
import datetime
import os
import signal

class IdleWatchdog:
    """
    A thread-safe watchdog to monitor server inactivity and trigger a shutdown.
    Its only concern is time.
    """
    def __init__(self, timeout_seconds=900):
        self.last_active_time = datetime.datetime.now()
        self.timeout = datetime.timedelta(seconds=timeout_seconds)
        self.lock = threading.Lock()
        watchdog_thread = threading.Thread(target=self._worker, daemon=True)
        watchdog_thread.start()
        print(f"--- IdleWatchdog started with a {timeout_seconds}s timeout. ---")

    def _worker(self):
        """The main loop for the watchdog thread."""
        while True:
            with self.lock:
                idle_time = datetime.datetime.now() - self.last_active_time
                if idle_time > self.timeout:
                    print(f"--- Watchdog: No activity for over {self.timeout.total_seconds()}s. Shutting down. ---")
                    os.kill(os.getpid(), signal.SIGTERM)
            time.sleep(10)

    def update_last_active_time(self):
        """Resets the idle timer. Should be called by the main application."""
        with self.lock:
            self.last_active_time = datetime.datetime.now()
            # --- ADD THIS LINE BACK IN FOR CLEARER TESTING LOGS ---
            print("--- Watchdog: Activity detected, timer reset. ---")