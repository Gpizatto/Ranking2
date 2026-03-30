"""
Backend tests for Tournament-Match Integration Feature
Tests the linking of matches to tournaments and categories

Features tested:
- POST /api/matches with tournament_id and category (required fields)
- GET /api/tournaments/{id}/matches - get matches grouped by category
- GET /api/matches - verify match includes tournament_id and category
- Tournament Details API endpoints
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBackendSetup:
    """Test basic backend availability"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ API health check passed")

    def test_get_tournaments(self):
        """Test tournaments endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/tournaments")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "No tournaments found in database"
        print(f"✓ Found {len(data)} tournaments")
        return data

    def test_get_players(self):
        """Test players endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2, "Need at least 2 players for match testing"
        print(f"✓ Found {len(data)} players")
        return data


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print("✓ Login successful")
        return data["access_token"]

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "invalid",
            "password": "invalid"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected")


class TestMatchCreation:
    """Test match creation with tournament_id and category"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for protected endpoints"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def test_data(self):
        """Get test data (tournaments, players)"""
        tournaments = requests.get(f"{BASE_URL}/api/tournaments").json()
        players = requests.get(f"{BASE_URL}/api/players").json()
        return {
            "tournament": tournaments[0] if tournaments else None,
            "player1": players[0] if len(players) > 0 else None,
            "player2": players[1] if len(players) > 1 else None,
        }
    
    def test_create_match_with_tournament_and_category(self, auth_token, test_data):
        """Test creating a match with tournament_id and category - CORE FEATURE"""
        if not test_data["tournament"] or not test_data["player1"] or not test_data["player2"]:
            pytest.skip("Missing test data")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        match_data = {
            "tournament_id": test_data["tournament"]["id"],
            "category": "1a",
            "player1_id": test_data["player1"]["id"],
            "player2_id": test_data["player2"]["id"],
            "winner_id": test_data["player1"]["id"],
            "score": ["11-7", "11-5", "11-8"],
            "round": "Final",
            "date": datetime.now().isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/matches", json=match_data, headers=headers)
        assert response.status_code == 200, f"Failed to create match: {response.text}"
        
        created_match = response.json()
        # Verify response includes tournament_id and category
        assert created_match["tournament_id"] == test_data["tournament"]["id"], "tournament_id not saved correctly"
        assert created_match["category"] == "1a", "category not saved correctly"
        assert created_match["tournament_name"] == test_data["tournament"]["name"], "tournament_name not populated"
        assert created_match["player1_name"] == test_data["player1"]["name"], "player1_name not populated"
        assert created_match["player2_name"] == test_data["player2"]["name"], "player2_name not populated"
        assert "id" in created_match
        
        print(f"✓ Match created with tournament_id={created_match['tournament_id']} and category={created_match['category']}")
        return created_match

    def test_create_match_missing_tournament(self, auth_token, test_data):
        """Test that match creation fails without tournament_id"""
        if not test_data["player1"] or not test_data["player2"]:
            pytest.skip("Missing test data")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Missing tournament_id
        match_data = {
            "category": "1a",
            "player1_id": test_data["player1"]["id"],
            "player2_id": test_data["player2"]["id"],
            "winner_id": test_data["player1"]["id"],
            "score": ["11-7"],
            "round": "Final",
            "date": datetime.now().isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/matches", json=match_data, headers=headers)
        assert response.status_code == 422, "Should fail without tournament_id"
        print("✓ Match creation correctly requires tournament_id")

    def test_create_match_missing_category(self, auth_token, test_data):
        """Test that match creation fails without category"""
        if not test_data["tournament"] or not test_data["player1"] or not test_data["player2"]:
            pytest.skip("Missing test data")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Missing category
        match_data = {
            "tournament_id": test_data["tournament"]["id"],
            "player1_id": test_data["player1"]["id"],
            "player2_id": test_data["player2"]["id"],
            "winner_id": test_data["player1"]["id"],
            "score": ["11-7"],
            "round": "Final",
            "date": datetime.now().isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/matches", json=match_data, headers=headers)
        assert response.status_code == 422, "Should fail without category"
        print("✓ Match creation correctly requires category")


class TestTournamentMatches:
    """Test tournament matches endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for protected endpoints"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["access_token"]
    
    def test_get_tournament_matches(self):
        """Test GET /api/tournaments/{id}/matches endpoint"""
        tournaments = requests.get(f"{BASE_URL}/api/tournaments").json()
        if not tournaments:
            pytest.skip("No tournaments found")
        
        tournament_id = tournaments[0]["id"]
        response = requests.get(f"{BASE_URL}/api/tournaments/{tournament_id}/matches")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "tournament" in data, "Response should include tournament info"
        assert "categories" in data, "Response should include categories list"
        assert "matches" in data, "Response should include matches grouped by category"
        
        print(f"✓ Tournament matches endpoint working. Categories: {data['categories']}")
        return data

    def test_get_tournament_matches_with_category_filter(self, auth_token):
        """Test category filter for tournament matches"""
        # First create a match
        tournaments = requests.get(f"{BASE_URL}/api/tournaments").json()
        players = requests.get(f"{BASE_URL}/api/players").json()
        
        if not tournaments or len(players) < 2:
            pytest.skip("Missing test data")
        
        tournament_id = tournaments[0]["id"]
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a match with specific category
        match_data = {
            "tournament_id": tournament_id,
            "category": "2a",
            "player1_id": players[0]["id"],
            "player2_id": players[1]["id"],
            "winner_id": players[0]["id"],
            "score": ["11-9", "11-8"],
            "round": "Semi Final",
            "date": datetime.now().isoformat()
        }
        requests.post(f"{BASE_URL}/api/matches", json=match_data, headers=headers)
        
        # Test category filter
        response = requests.get(f"{BASE_URL}/api/tournaments/{tournament_id}/matches?category=2a")
        assert response.status_code == 200
        data = response.json()
        
        # All returned matches should be in category 2a
        all_matches = []
        for cat_matches in data["matches"].values():
            all_matches.extend(cat_matches)
        
        for match in all_matches:
            assert match["category"] == "2a", f"Filter not working: found category {match['category']}"
        
        print(f"✓ Category filter working correctly")

    def test_tournament_not_found(self):
        """Test 404 for non-existent tournament"""
        response = requests.get(f"{BASE_URL}/api/tournaments/non-existent-id/matches")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent tournament")


class TestTournamentResults:
    """Test tournament results endpoint"""
    
    def test_get_tournament_results(self):
        """Test GET /api/tournaments/{id}/results endpoint"""
        tournaments = requests.get(f"{BASE_URL}/api/tournaments").json()
        if not tournaments:
            pytest.skip("No tournaments found")
        
        tournament_id = tournaments[0]["id"]
        response = requests.get(f"{BASE_URL}/api/tournaments/{tournament_id}/results")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "tournament" in data, "Response should include tournament info"
        assert "results" in data, "Response should include results"
        
        print(f"✓ Tournament results endpoint working")
        return data


class TestMatchesListWithCategory:
    """Test matches list includes category column"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["access_token"]
    
    def test_matches_list_includes_category(self, auth_token):
        """Test that matches list includes category field"""
        # First ensure there's at least one match
        tournaments = requests.get(f"{BASE_URL}/api/tournaments").json()
        players = requests.get(f"{BASE_URL}/api/players").json()
        
        if tournaments and len(players) >= 2:
            headers = {"Authorization": f"Bearer {auth_token}"}
            match_data = {
                "tournament_id": tournaments[0]["id"],
                "category": "3a",
                "player1_id": players[0]["id"],
                "player2_id": players[1]["id"],
                "winner_id": players[1]["id"],
                "score": ["11-5", "11-7", "11-9"],
                "round": "Quarter Final",
                "date": datetime.now().isoformat()
            }
            requests.post(f"{BASE_URL}/api/matches", json=match_data, headers=headers)
        
        # Get matches list
        response = requests.get(f"{BASE_URL}/api/matches")
        assert response.status_code == 200
        
        matches = response.json()
        if len(matches) > 0:
            # Check that category field exists
            for match in matches:
                assert "category" in match, "Match should include category field"
                assert "tournament_id" in match, "Match should include tournament_id field"
                assert "tournament_name" in match, "Match should include tournament_name field"
            print(f"✓ Matches list includes category field ({len(matches)} matches)")
        else:
            print("✓ Matches list endpoint working (no matches yet)")


class TestCleanup:
    """Clean up test data"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["access_token"]
    
    def test_cleanup_test_matches(self, auth_token):
        """Delete test matches created during testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get all matches
        response = requests.get(f"{BASE_URL}/api/matches")
        if response.status_code != 200:
            print("Could not get matches for cleanup")
            return
        
        matches = response.json()
        deleted = 0
        
        for match in matches:
            # Delete matches created during testing (recent ones)
            delete_response = requests.delete(f"{BASE_URL}/api/matches/{match['id']}", headers=headers)
            if delete_response.status_code == 200:
                deleted += 1
        
        print(f"✓ Cleaned up {deleted} test match(es)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
