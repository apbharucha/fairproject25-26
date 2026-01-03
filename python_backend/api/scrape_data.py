"""API endpoint for scraping data."""
from fastapi import APIRouter
from data.scrapers import get_dataset_manager

router = APIRouter()

@router.post("/api/scrape-data")
async def scrape_data():
    """Trigger data scraping from all three sources."""
    try:
        manager = get_dataset_manager()
        manager.scrape_all(force_refresh=True)
        return {
            "status": "success",
            "message": "Data scraped successfully from NCBI, CARD, and PubMLST",
            "sources": ["NCBI Pathogen Detection", "CARD", "PubMLST"]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@router.get("/api/dataset-stats")
async def get_dataset_stats():
    """Get statistics about scraped datasets."""
    try:
        manager = get_dataset_manager()
        import sqlite3
        
        conn = sqlite3.connect(manager.db_path)
        cursor = conn.cursor()
        
        stats = {}
        
        # NCBI stats
        cursor.execute("SELECT COUNT(*) FROM ncbi_isolates")
        stats["ncbi_isolates"] = cursor.fetchone()[0]
        
        # CARD stats
        cursor.execute("SELECT COUNT(*) FROM card_genes")
        stats["card_genes"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM card_mutations")
        stats["card_mutations"] = cursor.fetchone()[0]
        
        # PubMLST stats
        cursor.execute("SELECT COUNT(*) FROM pubmlst_sts")
        stats["pubmlst_sequence_types"] = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM mutation_frequencies")
        stats["mutation_frequencies"] = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "status": "success",
            "datasets": {
                "NCBI Pathogen Detection": {
                    "isolates": stats["ncbi_isolates"],
                    "description": "MRSA genomic sequences and isolate metadata"
                },
                "CARD": {
                    "resistance_genes": stats["card_genes"],
                    "mutations": stats["card_mutations"],
                    "description": "Comprehensive Antibiotic Resistance Database"
                },
                "PubMLST": {
                    "sequence_types": stats["pubmlst_sequence_types"],
                    "mutation_frequencies": stats["mutation_frequencies"],
                    "description": "Public databases for molecular typing"
                }
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

