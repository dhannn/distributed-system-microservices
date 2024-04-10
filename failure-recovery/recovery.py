import os
from transactions import *
import dotenv
import logging

dotenv.load_dotenv()

log_filename = os.environ['TRANSACTION_LOG']
logfile = open(log_filename, 'r')

logging.basicConfig(level=logging.INFO)

line = logfile.readline()

transactions = Transactions()
conn = Connection()

_dict = {
    'START': transactions.start,
    'COMMIT': transactions.end,
    'ABORT': transactions.end,
    'INSERT': transactions.add_operation,
    'MODIFY': transactions.add_operation,
}

while line:
    logging.info('Processing transaction log: %s', line.strip())
    ret = LogParser.parse(line.strip())

    try:
        query = _dict[ret[1]](*ret)
        
        if query is not None:
            succees = conn.execute_query(query)

            logging.info('Processed the database operation: %s', query)

            if succees:
                logging.info('Replaying log successful')
    except Exception as e:
        raise e
        print(f"Exception occurred: {e}")

    line = logfile.readline()
