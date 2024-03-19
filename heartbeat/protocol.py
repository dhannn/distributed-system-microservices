# Application Layer Protocol for Hearbeat
# [Sequence Num] [Host] [Status]

"""
    Application Layer Protocol for Heartbeat

    Format:
    [Timestamp] [Host] [Status]

    The protocol is simply a space-delimited text that contains the timestamp, 
    the host of the server and the status. The status can be ALIVE or DEAD.

    Example:
    S: 0 10.2.0.100 ALIVE
    S: 1 10.2.0.100 ALIVE
    S: 2 10.2.0.100 DEAD
    S: 3 10.2.0.100 DEAD
    S: 4 10.2.0.100 ALIVE

"""

import time


class HeartbeatProtocol:
    @staticmethod
    def write(timestamp: float, host: str, status: str) -> bytes:
        return f'{str(timestamp)} {host} {status}'.encode()
    
    @staticmethod
    def read(message: bytes) -> tuple[float, str, str]:
        try:
            timestamp, host, status = message.decode().split(' ')
            return float(timestamp), host, status
        except ValueError:
            raise ValueError('Invalid message format, expected: [timestamp] [host] [status]')
