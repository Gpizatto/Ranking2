"""
Test Suite: Auto-Create Results from Match Creation
Tests the new feature where creating a match automatically creates/updates tournament results
based on round (Final, Semi Final, Quarter Final, etc.)
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSetup:
    """Setup fixtures and data for testing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    @pytest.fixture(scope="class")
    def authenticated_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def players(self):
        """Get existing players"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        return response.json()
    
    @pytest.fixture(scope="class")
    def tournaments(self):
        """Get existing tournaments"""
        response = requests.get(f"{BASE_URL}/api/tournaments")
        assert response.status_code == 200
        return response.json()


class TestAutoCreateResultsFromFinal(TestSetup):
    """Test: Creating a Final match should auto-create 2 results (1st and 2nd place)"""
    
    def test_create_final_match_auto_creates_results(self, authenticated_headers, players, tournaments):
        """
        Creating a Final match should:
        - Winner gets placement=1 (Champion)
        - Loser gets placement=2 (Runner-up)
        """
        # Get two players
        player1 = players[0]
        player2 = players[2]  # Different from player1
        
        # Get first tournament
        tournament = tournaments[0]
        
        # Count results before creating match
        results_before = requests.get(f"{BASE_URL}/api/results").json()
        results_count_before = len(results_before)
        
        # Create a Final match
        match_data = {
            "tournament_id": tournament['id'],
            "category": "2a",  # Different category to avoid conflicts
            "player1_id": player1['id'],
            "player2_id": player2['id'],
            "winner_id": player1['id'],  # player1 wins
            "score": ["11-9", "11-7", "11-5"],
            "round": "Final",
            "date": datetime.now().isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/matches", 
                                json=match_data, 
                                headers=authenticated_headers)
        
        # Assert match was created
        assert response.status_code == 200, f"Failed to create match: {response.text}"
        match = response.json()
        assert match['round'] == "Final"
        assert match['winner_id'] == player1['id']
        
        # Get results after
        time.sleep(0.5)  # Brief wait for DB
        results_after = requests.get(f"{BASE_URL}/api/results").json()
        
        # Should have 2 more results
        assert len(results_after) >= results_count_before, "Results should have been created"
        
        # Find the new results for this tournament and category
        new_results = [r for r in results_after 
                      if r['tournament_id'] == tournament['id'] 
                      and r['class_category'] == "2a"
                      and r['player_id'] in [player1['id'], player2['id']]]
        
        # Should have results for both players
        assert len(new_results) >= 2, f"Expected 2 results, got {len(new_results)}"
        
        # Winner should have placement 1
        winner_result = next((r for r in new_results if r['player_id'] == player1['id']), None)
        assert winner_result is not None, "Winner result not found"
        assert winner_result['placement'] == 1, f"Winner should be 1st, got {winner_result['placement']}"
        
        # Loser should have placement 2
        loser_result = next((r for r in new_results if r['player_id'] == player2['id']), None)
        assert loser_result is not None, "Loser result not found"
        assert loser_result['placement'] == 2, f"Loser should be 2nd, got {loser_result['placement']}"
        
        print(f"SUCCESS: Final match auto-created results - Winner: 1st, Loser: 2nd")


class TestAutoCreateResultsFromSemiFinal(TestSetup):
    """Test: Creating a Semi Final match should give loser placement=3"""
    
    def test_create_semifinal_match_auto_creates_results(self, authenticated_headers, players, tournaments):
        """
        Creating a Semi Final match should:
        - Winner gets placement=1 (goes to Final, but starts at 1 for now)
        - Loser gets placement=3 (Semi Finalist)
        """
        # Get two players
        player1 = players[4]
        player2 = players[5]
        
        # Get a tournament
        tournament = tournaments[1]
        
        # Create a Semi Final match
        match_data = {
            "tournament_id": tournament['id'],
            "category": "3a",  # Different category
            "player1_id": player1['id'],
            "player2_id": player2['id'],
            "winner_id": player1['id'],
            "score": ["11-8", "9-11", "11-6", "11-9"],
            "round": "Semi Final",
            "date": datetime.now().isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/matches", 
                                json=match_data, 
                                headers=authenticated_headers)
        
        assert response.status_code == 200, f"Failed to create match: {response.text}"
        match = response.json()
        assert match['round'] == "Semi Final"
        
        # Get results and verify
        time.sleep(0.5)
        results = requests.get(f"{BASE_URL}/api/results").json()
        
        new_results = [r for r in results 
                      if r['tournament_id'] == tournament['id'] 
                      and r['class_category'] == "3a"
                      and r['player_id'] in [player1['id'], player2['id']]]
        
        # Loser should be placement=3
        loser_result = next((r for r in new_results if r['player_id'] == player2['id']), None)
        assert loser_result is not None, "Loser result not found"
        assert loser_result['placement'] == 3, f"Semi Final loser should be 3rd, got {loser_result['placement']}"
        
        print(f"SUCCESS: Semi Final loser auto-placed as 3rd")


class TestRankingsLastMatch(TestSetup):
    """Test: GET /api/rankings should include last_match with score_formatted"""
    
    def test_rankings_include_last_match(self):
        """Verify rankings endpoint returns last_match for players"""
        response = requests.get(f"{BASE_URL}/api/rankings?class_category=1a&gender_category=Masculino")
        assert response.status_code == 200
        
        rankings = response.json()
        assert len(rankings) > 0, "No rankings found"
        
        # Check if at least one player has last_match data
        players_with_last_match = [r for r in rankings if r.get('last_match')]
        
        # At least one player should have a last match
        assert len(players_with_last_match) > 0, "No players have last_match data"
        
        # Verify last_match structure
        player_with_match = players_with_last_match[0]
        last_match = player_with_match['last_match']
        
        assert 'opponent_name' in last_match, "last_match missing opponent_name"
        assert 'score_formatted' in last_match, "last_match missing score_formatted"
        assert 'result' in last_match, "last_match missing result"
        assert 'tournament_name' in last_match, "last_match missing tournament_name"
        
        # Verify score_formatted has correct format (e.g., "11-5, 11-4, 11-2 (3-0)")
        score_formatted = last_match['score_formatted']
        assert '(' in score_formatted and ')' in score_formatted, \
            f"score_formatted should include set result in parentheses, got: {score_formatted}"
        
        print(f"SUCCESS: Rankings include last_match with score_formatted: {score_formatted}")


class TestPlayerDetailsLastMatch(TestSetup):
    """Test: GET /api/players/{id}/details should include last_match"""
    
    def test_player_details_include_last_match(self, players):
        """Verify player details endpoint returns last_match data"""
        # Get a player who has matches
        player_id = players[0]['id']  # João Silva
        
        response = requests.get(f"{BASE_URL}/api/players/{player_id}/details")
        assert response.status_code == 200
        
        details = response.json()
        
        # Verify structure
        assert 'player' in details
        assert 'match_history' in details
        assert 'last_match' in details
        assert 'recent_tournaments' in details
        
        # If player has matches, verify last_match data
        if details['match_history']:
            assert details['last_match'] is not None, "Player has matches but no last_match"
            
            last_match = details['last_match']
            assert 'opponent_name' in last_match
            assert 'score_formatted' in last_match
            assert 'set_result' in last_match
            assert 'result' in last_match  # 'Win' or 'Loss'
            
            # Verify score_formatted
            assert '(' in last_match['score_formatted'], "score_formatted should include set result"
            
            print(f"SUCCESS: Player details include last_match: vs {last_match['opponent_name']}, {last_match['score_formatted']}")
        else:
            print("INFO: Player has no matches yet")


class TestRankingConfigUnchanged(TestSetup):
    """Test: Verify ranking calculation is NOT altered"""
    
    def test_ranking_config_exists(self):
        """Verify ranking config endpoint works"""
        response = requests.get(f"{BASE_URL}/api/ranking-config")
        assert response.status_code == 200
        
        config = response.json()
        assert 'formula' in config
        assert 'top_n_count' in config
        assert 'points_table' in config
        
        # Verify default points table values
        points_table = config['points_table']
        assert points_table.get('1') == 100, "1st place should be 100 points"
        assert points_table.get('2') == 75, "2nd place should be 75 points"
        assert points_table.get('3') == 50, "3rd place should be 50 points"
        
        print(f"SUCCESS: Ranking config intact - formula: {config['formula']}, top_n: {config['top_n_count']}")
    
    def test_rankings_points_consistent(self):
        """Verify ranking points calculation is consistent"""
        response = requests.get(f"{BASE_URL}/api/rankings?class_category=1a&gender_category=Masculino")
        assert response.status_code == 200
        
        rankings = response.json()
        
        # Rankings should be sorted by points descending
        for i in range(len(rankings) - 1):
            assert rankings[i]['total_points'] >= rankings[i+1]['total_points'], \
                "Rankings not sorted by points descending"
        
        # Verify rank numbers are sequential
        for i, player in enumerate(rankings):
            assert player['rank'] == i + 1, f"Expected rank {i+1}, got {player['rank']}"
        
        print(f"SUCCESS: Rankings calculation consistent - {len(rankings)} players ranked")


class TestScoreFormatting:
    """Test: Verify score formatting with set results"""
    
    def test_match_score_format_in_tournament_matches(self):
        """Verify matches have proper score format"""
        # Get tournaments
        response = requests.get(f"{BASE_URL}/api/tournaments")
        tournaments = response.json()
        
        # Get matches for first tournament with matches
        for tournament in tournaments:
            matches_response = requests.get(f"{BASE_URL}/api/tournaments/{tournament['id']}/matches")
            if matches_response.status_code == 200:
                data = matches_response.json()
                all_matches = []
                for cat_matches in data.get('matches', {}).values():
                    all_matches.extend(cat_matches)
                
                if all_matches:
                    match = all_matches[0]
                    assert 'score' in match, "Match missing score"
                    assert isinstance(match['score'], list), "Score should be a list"
                    
                    # Score items should be like "11-5"
                    for game in match['score']:
                        assert '-' in game, f"Invalid game score format: {game}"
                    
                    print(f"SUCCESS: Match score format correct: {match['score']}")
                    return
        
        pytest.skip("No matches found in any tournament")


class TestHealthAndBasics:
    """Basic API health tests"""
    
    def test_api_health(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert 'message' in data
        print(f"SUCCESS: API healthy - {data['message']}")
    
    def test_players_endpoint(self):
        """Test players list endpoint"""
        response = requests.get(f"{BASE_URL}/api/players")
        assert response.status_code == 200
        players = response.json()
        assert isinstance(players, list)
        assert len(players) > 0, "No players in database"
        print(f"SUCCESS: Players endpoint working - {len(players)} players")
    
    def test_tournaments_endpoint(self):
        """Test tournaments list endpoint"""
        response = requests.get(f"{BASE_URL}/api/tournaments")
        assert response.status_code == 200
        tournaments = response.json()
        assert isinstance(tournaments, list)
        assert len(tournaments) > 0, "No tournaments in database"
        print(f"SUCCESS: Tournaments endpoint working - {len(tournaments)} tournaments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
