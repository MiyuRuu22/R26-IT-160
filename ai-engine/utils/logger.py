import logging
import sys
import os

def setup_logger(name: str) -> logging.Logger:
    """Sets up a standardized logger."""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

        # Console Handler
        ch = logging.StreamHandler(sys.stdout)
        ch.setFormatter(formatter)
        logger.addHandler(ch)

        # Optional File Handler
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        fh = logging.FileHandler(os.path.join(log_dir, 'ai_engine.log'))
        fh.setFormatter(formatter)
        logger.addHandler(fh)

    return logger
