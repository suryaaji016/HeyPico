"""
# HeyPico Maps Tools
# Made by: suryaaji

import requests
from typing import Optional, Dict
from pydantic import BaseModel

# config
class Valves(BaseModel):
    BASE_URL: str = "http://localhost:3000/api/maps"
    TIMEOUT: int = 30


class Function:
    def __init__(self):
        self.valves = Valves()

    def search_places(
        self,
        query: str,
        location: Optional[Dict] = None,
        radius: Optional[int] = None,
        __user__: dict = {},
    ) -> str:
        # search for places
        try:
            body = {"query": query}
            if location:
                body["location"] = location
            if radius:
                body["radius"] = radius

            response = requests.post(
                f"{self.valves.BASE_URL}/search", json=body, timeout=self.valves.TIMEOUT
            )
            data = response.json()

            if data.get("success") and data.get("results"):
                results = data["results"][:5]  # Top 5 results
                output = f'Found {len(results)} places for "{query}":\n\n'

                for idx, place in enumerate(results, 1):
                    output += f"{idx}. **{place['name']}**\n"
                    output += f"   - Address: {place['address']}\n"
                    output += f"   - Rating: {place.get('rating', 'N/A')} ⭐"

                    if place.get("userRatingsTotal"):
                        output += f" ({place['userRatingsTotal']} reviews)"
                    output += "\n"

                    if place.get("priceLevel"):
                        output += f"   - Price: {'$' * place['priceLevel']}\n"

                    lat = place["location"]["lat"]
                    lng = place["location"]["lng"]
                    map_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}&query_place_id={place['id']}"
                    output += f"   - [View on Map]({map_link})\n\n"

                return output
            else:
                return f"No places found for: {query}"

        except Exception as e:
            return f"Error searching: {str(e)}"

    def find_nearby_places(
        self,
        latitude: float,
        longitude: float,
        placeType: Optional[str] = "",
        radius: Optional[int] = 5000,
        __user__: dict = {},
    ) -> str:
        # find nearby places
        try:
            body = {
                "location": {"lat": latitude, "lng": longitude},
                "radius": radius,
            }
            if placeType:
                body["type"] = placeType

            response = requests.post(
                f"{self.valves.BASE_URL}/nearby", json=body, timeout=self.valves.TIMEOUT
            )
            data = response.json()

            if data.get("success") and data.get("results"):
                results = data["results"][:5]
                place_text = placeType or "various places"
                output = f"Found {len(results)} {place_text} nearby:\n\n"

                for idx, place in enumerate(results, 1):
                    output += f"{idx}. **{place['name']}**\n"
                    output += f"   - Address: {place['address']}\n"
                    output += f"   - Rating: {place.get('rating', 'N/A')} ⭐\n"

                    lat = place["location"]["lat"]
                    lng = place["location"]["lng"]
                    map_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
                    output += f"   - [View on Map]({map_link})\n\n"

                return output
            else:
                return "No places found nearby"

        except Exception as e:
            return f"Error searching nearby: {str(e)}"

    def geocode_address(
        self, address: str, __user__: dict = {}
    ) -> str:
        # convert address to coordinates
        try:
            response = requests.post(
                f"{self.valves.BASE_URL}/geocode",
                json={"address": address},
                timeout=self.valves.TIMEOUT,
            )
            data = response.json()

            if data.get("success") and data.get("result"):
                result = data["result"]
                location = result["location"]

                output = "📍 **Location Found**\n\n"
                output += f"Address: {result['formattedAddress']}\n"
                output += f"Coordinates: {location['lat']}, {location['lng']}\n"

                map_link = f"https://www.google.com/maps/search/?api=1&query={location['lat']},{location['lng']}"
                output += f"\n[View on Google Maps]({map_link})"

                return output
            else:
                return f"Address not found: {address}"

        except Exception as e:
            return f"Error converting address: {str(e)}"
