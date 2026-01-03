# Datasets Used for Predictions

## Answer: What datasets are being used for the predictions?

### Current Implementation (Real Dataset Integration)

The Python implementation now **scrapes and uses real data from three mainstream databases**:

1. **NCBI Pathogen Detection** - National Center for Biotechnology Information

   - MRSA genomic sequences and isolate metadata
   - Real-time access to pathogen detection data
   - Source: https://www.ncbi.nlm.nih.gov/pathogens/

2. **CARD (Comprehensive Antibiotic Resistance Database)** - McMaster University

   - Resistance gene sequences and annotations
   - Known mutations in mecA, PBP2a, and other resistance genes
   - Source: https://card.mcmaster.ca/

3. **PubMLST (Public databases for molecular typing)**
   - S. aureus strain typing and population structure
   - Mutation frequencies across isolates
   - Sequence type distributions
   - Source: https://pubmlst.org/

### How It Works

1. **Data Scraping**: The system scrapes data from all three sources using their APIs
2. **Data Storage**: Scraped data is stored in SQLite database (`mrsa_data.db`)
3. **Prediction Enhancement**: Real mutation frequencies and known mutations are used to inform AI predictions
4. **Hybrid Approach**: Combines:
   - Real dataset information (mutation frequencies, known mutations)
   - AI/LLM knowledge (scientific literature patterns)
   - Heuristic calculations (mutation counts, co-occurrence patterns)

### Original Methodology (As Described)

According to the methodology section, the original project design intended to use:

1. **NCBI Pathogen Detection**: S. aureus genomic sequences and isolate metadata
2. **CARD (Comprehensive Antibiotic Resistance Database)**: Reference resistance gene sequences and annotations
3. **BV-BRC (Bacterial and Viral Bioinformatics Resource Center)**: Curated datasets and comparative genomics tools
4. **PubMLST**: S. aureus strain typing and population structure analysis

### How Predictions Work Now

The current system:

1. **Takes user input**: Mutation patterns (mecA, PBP2a mutations) or evolutionary trajectories
2. **Sends to AI model**: Uses OpenAI/OpenRouter API with carefully crafted prompts
3. **AI generates predictions**: Based on its training data (which includes scientific literature about MRSA)
4. **Returns probabilistic forecasts**: Resistance probabilities, rationale, and suggested interventions

### Data Scraping

To scrape fresh data from all three sources, run:

```bash
python3 scrape_datasets.py
```

Or use the API endpoint:

```bash
curl -X POST http://localhost:9000/api/scrape-data
```

Or use the Streamlit frontend: Navigate to "Datasets" section and click "Scrape Data from All Sources"

### Important Note

The predictions are **probabilistic and observational**, combining:

- **Real dataset information**: Actual mutation frequencies and known mutations from NCBI, CARD, and PubMLST
- **AI/LLM knowledge**: Scientific literature patterns from the language model
- **Heuristic calculations**: Mutation counts, co-occurrence patterns, and statistical calculations

The system now uses **real data** from three mainstream, large, and trustworthy databases to enhance prediction accuracy.
