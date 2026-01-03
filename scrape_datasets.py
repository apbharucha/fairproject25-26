#!/usr/bin/env python3
"""Script to scrape data from the three main datasets."""
import sys
import os

# Add python_backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_backend'))

from data.scrapers import get_dataset_manager

def main():
    """Main function to scrape all datasets."""
    print("=" * 60)
    print("🧬 MRSA Dataset Scraper")
    print("=" * 60)
    print("\nScraping data from three mainstream databases:")
    print("1. NCBI Pathogen Detection")
    print("2. CARD (Comprehensive Antibiotic Resistance Database)")
    print("3. PubMLST (Public databases for molecular typing)")
    print("\n" + "=" * 60 + "\n")
    
    manager = get_dataset_manager()
    manager.scrape_all(force_refresh=True)
    
    print("\n" + "=" * 60)
    print("✅ Data scraping complete!")
    print("=" * 60)
    print("\nDataset statistics:")
    
    import sqlite3
    conn = sqlite3.connect(manager.db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM ncbi_isolates")
    ncbi_count = cursor.fetchone()[0]
    print(f"  NCBI Pathogen Detection: {ncbi_count} isolates")
    
    cursor.execute("SELECT COUNT(*) FROM card_genes")
    card_genes = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM card_mutations")
    card_muts = cursor.fetchone()[0]
    print(f"  CARD: {card_genes} genes, {card_muts} mutations")
    
    cursor.execute("SELECT COUNT(*) FROM pubmlst_sts")
    pubmlst_sts = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM mutation_frequencies")
    pubmlst_freqs = cursor.fetchone()[0]
    print(f"  PubMLST: {pubmlst_sts} sequence types, {pubmlst_freqs} mutation frequencies")
    
    conn.close()
    print("\nData is now available for predictions!")

if __name__ == "__main__":
    main()

