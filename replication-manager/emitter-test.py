import unittest
import emitter
import tempfile
import threading
import time
from unittest.mock import patch, MagicMock

class TestEmitter(unittest.TestCase):
    @patch('socket.socket')
    def test_file_change(self, mock_socket):
        print('\nTEST SINGLE TRANSACTION')
        mock_socket.return_value = MagicMock()
        mock_socket.return_value.recv.return_value = b'ACK'

        # create temp file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file_name = temp_file.name
            temp_file.write(b'data')

        # call emitter
        emitter_thread = threading.Thread(target=emitter.emitter, args=([ ('localhost', 8000)], temp_file_name, 1))
        emitter_thread.start()

        # update data 1x
        with open(temp_file_name, 'wb') as temp_file:
            temp_file.write(b'new data')
        time.sleep(2)
        mock_socket.return_value.sendall.assert_called_once_with(b'new data')

        emitter_thread.join()
        
    @patch('socket.socket')
    def test_file_multiple_change(self, mock_socket):
        print('TEST MULTIPLE TRANSACTIONS')
        mock_socket.return_value = MagicMock()
        mock_socket.return_value.recv.return_value = b'ACK'

        # create temp file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file_name = temp_file.name
            temp_file.write(b'data')

        # call emitter
        emitter_thread = threading.Thread(target=emitter.emitter, args=([ ('localhost', 8000)], temp_file_name, 2))
        emitter_thread.start()

        # update data 2x
        with open(temp_file_name, 'wb') as temp_file:
            temp_file.write(b'new data')
        time.sleep(1)
        mock_socket.return_value.sendall.assert_called_with(b'new data')

        with open(temp_file_name, 'wb') as temp_file:
            temp_file.write(b'even newer data')
        time.sleep(1)
        mock_socket.return_value.sendall.assert_called_with(b'even newer data')

        emitter_thread.join()

if __name__ == '__main__':
    unittest.main()