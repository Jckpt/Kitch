import os
from curl_cffi import requests
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class KickAuthManager:
    def __init__(self):
        self.primary_token = os.getenv("KICK_API_KEY")
        self.secondary_token = os.getenv("KICK_API_KEY_SECONDARY")
        self.primary_client_id = os.getenv("KICK_CLIENT_ID")
        self.primary_client_secret = os.getenv("KICK_CLIENT_SECRET")
        self.secondary_client_id = os.getenv("KICK_CLIENT_ID_SECONDARY")
        self.secondary_client_secret = os.getenv("KICK_CLIENT_SECRET_SECONDARY")

    def refresh_token(self, client_id: str, client_secret: str) -> Optional[str]:
        """
        Odświeża token dostępu używając client credentials
        """
        try:
            response = requests.post(
                url="https://id.kick.com/oauth/token",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={
                    "grant_type": "client_credentials",
                    "client_id": client_id,
                    "client_secret": client_secret
                }
            )
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get("access_token")
                logger.info(f"Token odświeżony pomyślnie. Wygasa za: {token_data.get('expires_in')} sekund")
                return access_token
            else:
                logger.error(f"Błąd podczas odświeżania tokenu: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Wyjątek podczas odświeżania tokenu: {str(e)}")
            return None

    def refresh_primary_token(self) -> bool:
        """
        Odświeża główny token
        """
        if not self.primary_client_id or not self.primary_client_secret:
            logger.error("Brak danych do odświeżenia głównego tokenu")
            return False
            
        new_token = self.refresh_token(self.primary_client_id, self.primary_client_secret)
        if new_token:
            self.primary_token = new_token
            logger.info("Główny token odświeżony")
            return True
        return False

    def refresh_secondary_token(self) -> bool:
        """
        Odświeża zapasowy token
        """
        if not self.secondary_client_id or not self.secondary_client_secret:
            logger.error("Brak danych do odświeżenia zapasowego tokenu")
            return False
            
        new_token = self.refresh_token(self.secondary_client_id, self.secondary_client_secret)
        if new_token:
            self.secondary_token = new_token
            logger.info("Zapasowy token odświeżony")
            return True
        return False

    def get_primary_token(self) -> str:
        """
        Zwraca główny token
        """
        return self.primary_token

    def get_secondary_token(self) -> str:
        """
        Zwraca zapasowy token
        """
        return self.secondary_token

    def make_authenticated_request(self, method: str, url: str, use_secondary: bool = False, **kwargs) -> requests.Response:
        """
        Wykonuje zapytanie z automatycznym odświeżaniem tokenu w przypadku błędu 401
        """
        token = self.secondary_token if use_secondary else self.primary_token
        
        if "headers" not in kwargs:
            kwargs["headers"] = {}
        kwargs["headers"]["Authorization"] = f"Bearer {token}"
        
        response = requests.request(method, url, **kwargs)
        
        # Jeśli dostajemy 401, spróbuj odświeżyć token i ponów zapytanie
        if response.status_code == 401:
            logger.warning("Otrzymano błąd 401, próbuję odświeżyć token...")
            
            if use_secondary:
                if self.refresh_secondary_token():
                    kwargs["headers"]["Authorization"] = f"Bearer {self.secondary_token}"
                    response = requests.request(method, url, **kwargs)
                    logger.info("Zapytanie wykonane ponownie z nowym zapasowym tokenem")
            else:
                if self.refresh_primary_token():
                    kwargs["headers"]["Authorization"] = f"Bearer {self.primary_token}"
                    response = requests.request(method, url, **kwargs)
                    logger.info("Zapytanie wykonane ponownie z nowym głównym tokenem")
        
        return response

# Globalna instancja managera
auth_manager = KickAuthManager() 