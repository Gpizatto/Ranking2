#!/usr/bin/env python3
"""Script para popular o banco de dados com dados de exemplo"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import uuid
import os
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(env_path)

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🗑️  Limpando banco de dados...")
    await db.players.delete_many({})
    await db.tournaments.delete_many({})
    await db.results.delete_many({})
    await db.ranking_config.delete_many({})
    
    print("👥 Criando jogadores de exemplo...")
    players = [
        {"id": str(uuid.uuid4()), "name": "João Silva", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Maria Santos", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Pedro Oliveira", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Ana Costa", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Carlos Ferreira", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Juliana Lima", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Roberto Souza", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Fernanda Alves", "photo_url": None, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.players.insert_many(players)
    print(f"✅ Criados {len(players)} jogadores")
    
    print("🏆 Criando torneios de exemplo...")
    today = datetime.now(timezone.utc)
    tournaments = [
        {
            "id": str(uuid.uuid4()), 
            "name": "Campeonato Paranaense 2025",
            "date": (today - timedelta(days=30)).isoformat(),
            "location": "Curitiba, PR",
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()), 
            "name": "Copa de Squash PR",
            "date": (today - timedelta(days=60)).isoformat(),
            "location": "Londrina, PR",
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()), 
            "name": "Torneio de Inverno",
            "date": (today - timedelta(days=90)).isoformat(),
            "location": "Maringá, PR",
            "created_at": today.isoformat()
        },
    ]
    
    await db.tournaments.insert_many(tournaments)
    print(f"✅ Criados {len(tournaments)} torneios")
    
    print("⚙️ Criando configuração de ranking...")
    ranking_config = {
        "id": str(uuid.uuid4()),
        "formula": "top_n",
        "top_n_count": 5,
        "points_table": {
            "1": 100, "2": 75, "3": 50, "4": 50,
            "5": 25, "6": 25, "7": 25, "8": 25,
            "9": 10, "10": 10, "11": 10, "12": 10,
            "13": 10, "14": 10, "15": 10, "16": 10
        },
        "updated_at": today.isoformat()
    }
    
    await db.ranking_config.insert_one(ranking_config)
    print("✅ Configuração de ranking criada")
    
    print("📊 Criando resultados de exemplo...")
    results = []
    
    # Torneio 1 - Masculino 1a
    results.extend([
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[0]["id"],
            "player_name": players[0]["name"],
            "class_category": "1a",
            "gender_category": "Masculino",
            "placement": 1,
            "points": 100.0,
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[2]["id"],
            "player_name": players[2]["name"],
            "class_category": "1a",
            "gender_category": "Masculino",
            "placement": 2,
            "points": 75.0,
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[4]["id"],
            "player_name": players[4]["name"],
            "class_category": "1a",
            "gender_category": "Masculino",
            "placement": 3,
            "points": 50.0,
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[6]["id"],
            "player_name": players[6]["name"],
            "class_category": "1a",
            "gender_category": "Masculino",
            "placement": 4,
            "points": 50.0,
            "created_at": today.isoformat()
        },
    ])
    
    # Torneio 1 - Feminino 1a
    results.extend([
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[1]["id"],
            "player_name": players[1]["name"],
            "class_category": "1a",
            "gender_category": "Feminino",
            "placement": 1,
            "points": 100.0,
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[3]["id"],
            "player_name": players[3]["name"],
            "class_category": "1a",
            "gender_category": "Feminino",
            "placement": 2,
            "points": 75.0,
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[5]["id"],
            "player_name": players[5]["name"],
            "class_category": "1a",
            "gender_category": "Feminino",
            "placement": 3,
            "points": 50.0,
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[0]["id"],
            "player_id": players[7]["id"],
            "player_name": players[7]["name"],
            "class_category": "1a",
            "gender_category": "Feminino",
            "placement": 4,
            "points": 50.0,
            "created_at": today.isoformat()
        },
    ])
    
    # Torneio 2 - Masculino 1a
    results.extend([
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[1]["id"],
            "player_id": players[2]["id"],
            "player_name": players[2]["name"],
            "class_category": "1a",
            "gender_category": "Masculino",
            "placement": 1,
            "points": 100.0,
            "created_at": today.isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tournament_id": tournaments[1]["id"],
            "player_id": players[0]["id"],
            "player_name": players[0]["name"],
            "class_category": "1a",
            "gender_category": "Masculino",
            "placement": 2,
            "points": 75.0,
            "created_at": today.isoformat()
        },
    ])
    
    await db.results.insert_many(results)
    print(f"✅ Criados {len(results)} resultados")
    
    print("\n🎉 Banco de dados populado com sucesso!")
    print(f"   - {len(players)} jogadores")
    print(f"   - {len(tournaments)} torneios")
    print(f"   - {len(results)} resultados")
    print(f"   - 1 configuração de ranking")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
