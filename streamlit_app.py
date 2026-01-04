"""Streamlit frontend for MRSA Resistance Forecaster."""
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from typing import Dict, Any, List
import httpx
import asyncio
import os
import socket
from urllib.parse import urljoin, urlparse
from datetime import datetime

# Page config
st.set_page_config(
    page_title="MRSA Resistance Forecaster",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API base URL - configurable via environment variable, secrets, or sidebar
# For local development: use localhost (default)
# For Streamlit Cloud: configure API_BASE_URL in Streamlit Cloud settings
# Priority: env var > secrets > default
DEFAULT_API_URL = "http://127.0.0.1:9000"  # Local development default
API_BASE_URL = os.getenv("API_BASE_URL") or st.secrets.get("api_base_url", DEFAULT_API_URL)

if st.sidebar.checkbox("Configure API URL"):
    user_input = st.sidebar.text_input("API Base URL", value=API_BASE_URL)
    if user_input:
        # If user entered 0.0.0.0 (common when servers bind to all interfaces),
        # replace with loopback so the client can connect from the local environment.
        sanitized = user_input.replace("0.0.0.0", "127.0.0.1")
        API_BASE_URL = sanitized
    
    # Show current API URL being used
    st.sidebar.info(f"📍 Using API: {API_BASE_URL}")

# Sidebar quick-check: test API connectivity (resolves DNS and hits /health)
def _check_api_connection(api_url: str) -> None:
    parsed = urlparse(api_url)
    host = parsed.hostname
    port = parsed.port or (443 if parsed.scheme == 'https' else 80)

    try:
        # DNS resolution
        socket.getaddrinfo(host, port)
    except socket.gaierror as e:
        st.error(
            f"DNS error: could not resolve host '{host}'.\n"
            "Check that the API URL in Streamlit secrets is correct and reachable."
        )
        return

    # Try health endpoint
    health_url = urljoin(api_url.rstrip('/') + '/', 'health')
    try:
        resp = httpx.get(health_url, timeout=10.0)
        if resp.status_code == 200:
            st.success(f"API reachable: {health_url} (status 200)")
        else:
            st.warning(f"API responded with status {resp.status_code}: {resp.text}")
    except Exception as e:
        st.error(f"Connection error when contacting API: {e}")

if st.sidebar.button("Test API connection"):
    _check_api_connection(API_BASE_URL)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #6e59f9;
        margin-bottom: 1rem;
    }
    .section-header {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 1rem;
    }
    .prediction-card {
        background-color: #f0f0f0;
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)


def call_api(endpoint: str, method: str = "GET", data: Dict = None) -> Dict:
    """Call the FastAPI backend."""
    base = API_BASE_URL.strip()
    # Ensure scheme is present; default to http if missing
    parsed = urlparse(base)
    if not parsed.scheme:
        base = f"http://{base}"

    # Sanitize common problematic host bindings
    base = base.replace("0.0.0.0", "127.0.0.1")
    # Build final URL
    url = urljoin(base.rstrip('/') + '/', endpoint.lstrip('/'))
    try:
        if method == "GET":
            response = httpx.get(url, timeout=30.0)
        elif method == "POST":
            response = httpx.post(url, json=data, timeout=60.0)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        # More actionable error message for users
        msg = str(e)
        # If the error is due to attempting to connect to 0.0.0.0 or similar,
        # try a fallback to loopback and retry once.
        if "Cannot assign requested address" in msg or "Errno 99" in msg:
            # Attempt to replace host with 127.0.0.1 and retry once
            parsed = urlparse(url)
            fallback_base = f"{parsed.scheme}://127.0.0.1:{parsed.port}"
            fallback_url = urljoin(fallback_base.rstrip('/') + '/', parsed.path.lstrip('/'))
            try:
                if method == "GET":
                    response = httpx.get(fallback_url, timeout=30.0)
                else:
                    response = httpx.post(fallback_url, json=data, timeout=60.0)
                response.raise_for_status()
                return response.json()
            except Exception:
                st.error(
                    "Connection error: Could not connect to the API host. "
                    "Please ensure the backend is running and set the API URL to http://127.0.0.1:9000 in the sidebar."
                )
                return {}
        else:
            st.error(f"Connection error: {msg}")
            return {}
    except OSError as e:
        st.error(f"Network error: {e.strerror if hasattr(e, 'strerror') else str(e)}")
        return {}
    except httpx.HTTPStatusError as e:
        st.error(f"API error: {e.response.status_code} - {e.response.text}")
        return {}


def render_chart(chart_data: Dict[str, Any], chart_type: str = "bar"):
    """Render a chart using Plotly."""
    if not chart_data.get('data'):
        return
    
    df = pd.DataFrame(chart_data['data'])
    title = chart_data.get('title', 'Chart')
    
    if chart_type == "pie" or len(df) <= 3:
        fig = px.pie(
            df,
            values='value',
            names='name',
            title=title,
            hole=0.3 if len(df) <= 3 else 0
        )
    elif 'Contribution' in title:
        fig = px.bar(
            df,
            x='name',
            y='value',
            title=title,
            labels={'value': 'Relative Contribution Score', 'name': 'Mutation / Feature'}
        )
    elif 'Co-occurrence' in title:
        fig = px.area(
            df,
            x='name',
            y='value',
            title=title,
            labels={'value': 'Co-occurrence Frequency', 'name': 'Mutation / Feature'}
        )
    else:
        fig = px.bar(
            df,
            x='name',
            y='value',
            title=title,
            labels={'value': 'Probability', 'name': 'Antibiotic'}
        )
    
    fig.update_layout(height=400)
    st.plotly_chart(fig, use_container_width=True)


def bayesian_prediction_tool():
    """Bayesian Network Modeler tool."""
    st.markdown('<div class="section-header">🧠 Bayesian Network Modeler</div>', unsafe_allow_html=True)
    st.markdown("Enter comma-separated mutation names for mecA and PBP2a to predict resistance probabilities.")
    
    with st.form("bayesian_form"):
        mec_a = st.text_input(
            "mecA Mutations",
            placeholder="e.g., G246E, I112V",
            help="Comma-separated list of mecA mutations"
        )
        pbp2a = st.text_input(
            "PBP2a Mutations",
            placeholder="e.g., E447K, V311A",
            help="Comma-separated list of PBP2a mutations"
        )
        vancomycin_profile = st.text_input(
            "Vancomycin Resistance Profile (Optional)",
            placeholder="e.g., Known resistance mechanisms..."
        )
        ceftaroline_profile = st.text_input(
            "Ceftaroline Resistance Profile (Optional)",
            placeholder="e.g., Known resistance mechanisms..."
        )
        
        submitted = st.form_submit_button("🔮 Model Probabilities", use_container_width=True)
    
    if submitted:
        if not mec_a or not pbp2a:
            st.error("Please provide both mecA and PBP2a mutations.")
            return
        
        mec_a_list = [m.strip() for m in mec_a.split(',') if m.strip()]
        pbp2a_list = [m.strip() for m in pbp2a.split(',') if m.strip()]
        
        if not mec_a_list and not pbp2a_list:
            st.error("Please provide at least one mutation.")
            return
        
        with st.spinner("Modeling probabilities..."):
            result = call_api(
                "/api/predictions/bayesian",
                method="POST",
                data={
                    "mecAMutations": mec_a_list,
                    "pbp2aMutations": pbp2a_list,
                    "vancomycinResistanceProfile": vancomycin_profile or None,
                    "ceftarolineResistanceProfile": ceftaroline_profile or None
                }
            )
        
        if result and 'output' in result:
            output = result['output']
            st.markdown('<div class="prediction-card">', unsafe_allow_html=True)
            st.markdown("### 🤖 AI Model Result")
            
            # Probabilities
            col1, col2 = st.columns(2)
            with col1:
                van_prob = output.get('vancomycinResistanceProbability', 0)
                st.metric("Vancomycin Resistance Probability", f"{van_prob * 100:.1f}%")
                st.progress(van_prob)
            
            with col2:
                cef_prob = output.get('ceftarolineResistanceProbability', 0)
                st.metric("Ceftaroline Resistance Probability", f"{cef_prob * 100:.1f}%")
                st.progress(cef_prob)
            
            # Threat level and confidence
            threat_level = output.get('threatLevel', 'Unknown')
            confidence = output.get('confidenceLevel', (van_prob + cef_prob) / 2)
            st.markdown(f"**Threat Level:** {threat_level} | **Confidence:** {confidence * 100:.1f}%")
            
            # Contributing features
            if output.get('contributingFeatures'):
                with st.expander("Contributing Features"):
                    for feat in output['contributingFeatures']:
                        st.markdown(f"- {feat['name']} — {int(feat['weight'] * 100)}%")
            
            # Breakdown analysis
            if output.get('breakdownAnalysis'):
                with st.expander("Breakdown Analysis"):
                    st.markdown(output['breakdownAnalysis'])
            
            # Charts
            if output.get('charts'):
                st.markdown("### 📊 Visualizations")
                for chart in output['charts']:
                    render_chart(chart, "pie" if len(chart.get('data', [])) <= 3 else "bar")
            
            # Rationale
            if output.get('rationale'):
                st.markdown("### 📝 In-Depth Rationale")
                st.markdown(output['rationale'])
            
            # Solution
            if output.get('solution'):
                with st.expander("💡 Possible Solution"):
                    st.markdown(output['solution'])
            
            st.markdown('</div>', unsafe_allow_html=True)


def evolutionary_prediction_tool():
    """Evolutionary Resistance Predictor tool."""
    st.markdown('<div class="section-header">🧬 Evolutionary Resistance Predictor</div>', unsafe_allow_html=True)
    st.markdown("Input observed mutation patterns and evolutionary data to predict the likelihood of resistance.")
    
    with st.form("evolutionary_form"):
        mutation_patterns = st.text_area(
            "Mutation Patterns",
            placeholder="e.g., Co-occurrence of mecA(G246E) and PBP2a(V311A)...",
            help="Describe observed mutation patterns in MRSA isolates."
        )
        evolutionary_trajectories = st.text_area(
            "Evolutionary Trajectories",
            placeholder="e.g., Sequential acquisition: mecA -> PBP2a(T123C) -> pvl...",
            help="Represent evolutionary paths as a sequence of mutations."
        )
        existing_knowledge = st.text_area(
            "Existing Knowledge (Optional)",
            placeholder="e.g., Known resistance mutations for vancomycin...",
            help="Add any known mutation-drug resistance links."
        )
        
        submitted = st.form_submit_button("🔮 Predict Resistance Emergence", use_container_width=True)
    
    if submitted:
        if not mutation_patterns or not evolutionary_trajectories:
            st.error("Please provide both mutation patterns and evolutionary trajectories.")
            return
        
        with st.spinner("Predicting resistance emergence..."):
            result = call_api(
                "/api/predictions/evolutionary",
                method="POST",
                data={
                    "mutationPatterns": mutation_patterns,
                    "evolutionaryTrajectories": evolutionary_trajectories,
                    "existingKnowledge": existing_knowledge or None
                }
            )
        
        if result and 'output' in result:
            output = result['output']
            st.markdown('<div class="prediction-card">', unsafe_allow_html=True)
            st.markdown("### 🤖 AI Prediction Result")
            
            # Prediction summary
            if output.get('resistancePrediction'):
                st.markdown("### 📋 Resistance Prediction Summary")
                st.markdown(output['resistancePrediction'])
            
            # Threat level and confidence
            threat_level = output.get('threatLevel', 'Unknown')
            confidence = output.get('confidenceLevel', 0)
            st.markdown(f"**Threat Level:** {threat_level} | **Confidence:** {confidence * 100:.1f}%")
            
            # Contributing features
            if output.get('contributingFeatures'):
                with st.expander("Contributing Features"):
                    for feat in output['contributingFeatures']:
                        st.markdown(f"- {feat['name']} — {int(feat['weight'] * 100)}%")
            
            # Breakdown analysis
            if output.get('breakdownAnalysis'):
                with st.expander("Breakdown Analysis"):
                    st.markdown(output['breakdownAnalysis'])
            
            # Charts
            if output.get('charts'):
                st.markdown("### 📊 Visualizations")
                for chart in output['charts']:
                    chart_type = "pie" if "Contribution" in chart.get('title', '') else "area" if "Co-occurrence" in chart.get('title', '') else "bar"
                    render_chart(chart, chart_type)
            
            # Explanation
            if output.get('inDepthExplanation'):
                st.markdown("### 📝 In-Depth Explanation")
                st.markdown(output['inDepthExplanation'])
            
            # Interventions
            if output.get('suggestedInterventions'):
                with st.expander("💡 Suggested Interventions"):
                    st.markdown(output['suggestedInterventions'])
            
            st.markdown('</div>', unsafe_allow_html=True)


def prediction_history():
    """Display prediction history."""
    st.markdown('<div class="section-header">📜 Prediction History</div>', unsafe_allow_html=True)
    
    if st.button("🔄 Refresh History"):
        st.rerun()
    
    result = call_api("/api/predictions?limit=10")
    
    if result and 'predictions' in result:
        predictions = result['predictions']
        if not predictions:
            st.info("No predictions yet. Create a prediction using the tools above!")
            return
        
        for pred in predictions:
            with st.expander(f"Prediction #{pred['id']} - {pred['type']} - {pred.get('createdAt', 'Unknown date')}"):
                st.json(pred)
    else:
        st.warning("Could not load prediction history. Make sure the API is running.")


def project_summary():
    """Project Summary section."""
    st.markdown('<div class="section-header">📊 Project Summary</div>', unsafe_allow_html=True)
    
    st.markdown("### Predicting the Emergence of Antibiotic Resistance in MRSA Using Evolutionary Modeling")
    
    st.markdown("**Core Research Question:**")
    st.info("""
    Can computational modeling of mutation trajectories in MRSA resistance genes, specifically mecA and PBP2a, 
    under selective pressure from vancomycin and ceftaroline, accurately predict the emergence of phenotypic 
    antibiotic resistance before it becomes clinically observable?
    """)


def introduction():
    """Introduction section."""
    st.markdown('<div class="section-header">📝 Introduction</div>', unsafe_allow_html=True)
    
    st.markdown("### Abstract")
    st.write("""
    Methicillin-resistant Staphylococcus aureus (MRSA) poses a significant global health threat, exacerbated by 
    the emergence of resistance to last-resort antibiotics. Early prediction of resistance is critical for effective 
    clinical management and public health intervention. This project introduces a computational framework to predict 
    the emergence of phenotypic antibiotic resistance in MRSA by modeling evolutionary trajectories of key resistance 
    genes, providing a probabilistic forecast of resistance emergence based on genotypic data alone. This predictive 
    approach offers a powerful, non-biological tool for genomic surveillance, enabling proactive strategies to mitigate 
    the spread of multi-drug resistant MRSA.
    """)
    
    st.markdown("### Background & Significance")
    st.write("""
    Methicillin-resistant Staphylococcus aureus (MRSA) is a leading cause of healthcare-associated infections worldwide. 
    Its resistance to beta-lactam antibiotics, conferred by the mecA gene, necessitates the use of last-resort antibiotics 
    like vancomycin and ceftaroline. However, the continued evolution of MRSA has led to strains with reduced susceptibility 
    or outright resistance to these critical drugs, creating a formidable clinical challenge.
    """)
    
    st.markdown("### Common Symptoms")
    st.write("""
    MRSA infections often start as small, red bumps that can quickly turn into deep, painful abscesses. Other symptoms 
    include warmth around the infected area, pus or other drainage, and fever. If the infection spreads to the bloodstream, 
    it can cause severe and life-threatening conditions like sepsis and pneumonia.
    """)
    
    st.markdown("### Impact Over the Years")
    st.write("""
    The burden of MRSA on public health has grown steadily. The delay between the emergence of a resistant genotype and 
    its detection via traditional lab testing can be weeks or months. During this period, ineffective treatments may be 
    administered, leading to poor patient outcomes and facilitating the further spread of the resistant strain.
    """)
    
    # Impact table
    impact_data = pd.DataFrame({
        'Year': [2017, 2019, 2021, 2023],
        'Estimated Cases': ['2,000,000', '2,100,000', '2,200,000', '2,300,000'],
        'Estimated Hospitalizations': ['500,000', '525,000', '550,000', '575,000'],
        'Estimated Deaths': ['20,000', '21,000', '22,000', '23,000']
    })
    st.dataframe(impact_data, use_container_width=True, hide_index=True)
    st.caption("Note: Data is illustrative and based on aggregated public health estimates.")


def methodology():
    """Methodology section."""
    st.markdown('<div class="section-header">🔬 Methodology</div>', unsafe_allow_html=True)
    
    tab1, tab2, tab3, tab4 = st.tabs([
        "Data Acquisition", 
        "Mutation Detection", 
        "Feature Engineering", 
        "Predictive Modeling"
    ])
    
    with tab1:
        st.write("""
        Genomic sequences of MRSA isolates and corresponding antibiotic susceptibility metadata were collected from 
        several public databases: NCBI Pathogen Detection, the Comprehensive Antibiotic Resistance Database (CARD), 
        the Bacterial and Viral Bioinformatics Resource Center (BV-BRC), and PubMLST. This provided a diverse dataset 
        encompassing various MRSA lineages and resistance profiles.
        """)
    
    with tab2:
        st.write("""
        A bioinformatics pipeline was developed to align the collected sequences to a reference S. aureus genome. 
        Single Nucleotide Polymorphisms (SNPs) and other genetic variations were identified, with a primary focus 
        on the mecA gene, the PBP2a gene it encodes, and known accessory resistance loci. This step generated a 
        comprehensive list of mutations for each isolate.
        """)
    
    with tab3:
        st.write("""
        The raw mutation data was transformed into a structured feature set for machine learning. Features included 
        the presence/absence of specific mutations, mutation frequencies across the dataset, and co-occurrence patterns 
        between mutations. This process converted biological sequence data into a format suitable for computational modeling.
        """)
    
    with tab4:
        st.write("""
        Two primary modeling techniques were used: 1) Hidden Markov Models (HMMs) to map the evolutionary trajectories 
        of resistance genes, identifying common pathways of mutation accumulation under simulated antibiotic pressure. 
        2) Bayesian Networks to model the probabilistic relationships between the identified mutations (genotype) and the 
        observed antibiotic resistance (phenotype) for vancomycin and ceftaroline. The combination of these models allows 
        for a probabilistic forecast of resistance.
        """)
    
    st.markdown("---")
    st.markdown("### Data Sources and Ethical Compliance")
    st.write("""
    This project exclusively utilized anonymized, publicly available data from established scientific repositories. 
    All data sources are compliant with international standards for open scientific data sharing. The primary databases used were:
    """)
    st.markdown("""
    - **NCBI Pathogen Detection**: For S. aureus genomic sequences and isolate metadata.
    - **CARD (Comprehensive Antibiotic Resistance Database)**: For reference resistance gene sequences and annotations.
    - **BV-BRC (Bacterial and Viral Bioinformatics Resource Center)**: For curated datasets and comparative genomics tools.
    - **PubMLST**: For S. aureus strain typing and population structure analysis.
    """)
    st.write("""
    As no human subjects, animal subjects, or personally identifiable information were involved, and all data was 
    pre-existing and public, this research did not require Institutional Review Board (IRB) or Scientific Review 
    Committee (SRC) pre-approval beyond standard safety checks for computational projects.
    """)


def visualizations():
    """Visualizations section."""
    st.markdown('<div class="section-header">📊 Interactive Data Visualization</div>', unsafe_allow_html=True)
    st.caption("Explore visualizations of mutation patterns, evolutionary trajectories, and predicted resistance probabilities. (Note: Data shown is illustrative.)")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### Mutation Frequencies")
        st.caption("Frequency of key mutations observed in the dataset.")
        mutation_data = pd.DataFrame({
            'mutation': ['mecA(G246E)', 'PBP2a(E447K)', 'pvl(positive)', 'agr(type-II)', 'PBP2a(V311A)', 'mecA(I112V)'],
            'frequency': [45, 32, 28, 22, 18, 15]
        })
        fig = px.bar(mutation_data, x='mutation', y='frequency', 
                     labels={'mutation': 'Mutation', 'frequency': 'Frequency (%)'})
        fig.update_xaxes(tickangle=-30)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.markdown("### Evolutionary Trajectories")
        st.caption("Probabilistic path of mutation accumulation over time.")
        trajectory_data = pd.DataFrame({
            'step': [0, 1, 2, 3, 4, 5],
            'probability': [0.05, 0.12, 0.25, 0.45, 0.68, 0.82]
        })
        fig = px.line(trajectory_data, x='step', y='probability',
                     labels={'step': 'Evolutionary Step', 'probability': 'Probability'})
        fig.update_traces(mode='lines+markers', marker_size=10)
        st.plotly_chart(fig, use_container_width=True)


def impact():
    """Impact section."""
    st.markdown('<div class="section-header">💡 Applications and Real-World Impact</div>', unsafe_allow_html=True)
    
    st.write("The computational framework developed in this project has several potential real-world applications:")
    st.markdown("""
    1. **Genomic Surveillance**: Public health labs can use this model to analyze MRSA genomes from surveillance programs, 
       identifying high-risk strains before they become widespread.
    2. **Clinical Decision Support**: In a clinical setting, the model could provide clinicians with a risk score for 
       resistance, guiding the choice of empiric antibiotic therapy while waiting for traditional culture results.
    3. **Drug Development**: Pharmaceutical researchers can use the evolutionary trajectories to understand resistance 
       pathways, informing the design of new antibiotics that are less susceptible to existing resistance mechanisms.
    """)
    
    st.markdown("---")
    st.markdown("### Limitations and Responsible Use Statement")
    st.write("""
    It is crucial to acknowledge the limitations of this predictive model. As an in silico tool, it provides probabilistic 
    forecasts, not definitive diagnoses. Predictions must be validated with phenotypic testing. The model's accuracy is 
    dependent on the quality and diversity of the public data it was trained on, and it may not generalize perfectly to 
    all MRSA lineages or novel resistance mechanisms.
    """)
    st.warning("""
    **Responsible Use:** This tool is intended for research and surveillance purposes. It is not a substitute for clinical 
    judgment or established laboratory diagnostics. Any application in a clinical context should be done under an approved 
    research protocol and with the understanding that it is an assistive tool, not a standalone diagnostic. The model does 
    not provide instructions for creating or inducing resistance and should be used solely for predictive and preventive analysis.
    """)


def datasets_section():
    """Datasets section showing scraped data."""
    st.markdown('<div class="section-header">📚 Datasets</div>', unsafe_allow_html=True)
    
    st.markdown("""
    ### Data Sources
    
    This project uses data from three mainstream, large, and trustworthy databases:
    
    1. **NCBI Pathogen Detection** - National Center for Biotechnology Information
    2. **CARD** - Comprehensive Antibiotic Resistance Database (McMaster University)
    3. **PubMLST** - Public databases for molecular typing and microbial genome diversity
    """)
    
    # Get dataset statistics
    stats_result = call_api("/api/dataset-stats")
    
    if stats_result and stats_result.get("status") == "success":
        datasets = stats_result.get("datasets", {})
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                "NCBI Isolates",
                datasets.get("NCBI Pathogen Detection", {}).get("isolates", 0),
                help="MRSA genomic sequences and isolate metadata"
            )
        
        with col2:
            card_data = datasets.get("CARD", {})
            st.metric(
                "CARD Mutations",
                card_data.get("mutations", 0),
                help=f"Resistance genes: {card_data.get('resistance_genes', 0)}"
            )
        
        with col3:
            pubmlst_data = datasets.get("PubMLST", {})
            st.metric(
                "PubMLST Frequencies",
                pubmlst_data.get("mutation_frequencies", 0),
                help=f"Sequence types: {pubmlst_data.get('sequence_types', 0)}"
            )
        
        st.markdown("---")
        
        # Show detailed information
        st.markdown("### Dataset Details")
        
        for name, data in datasets.items():
            with st.expander(f"📊 {name}"):
                st.write(f"**Description:** {data.get('description', 'N/A')}")
                for key, value in data.items():
                    if key != 'description':
                        st.write(f"**{key.replace('_', ' ').title()}:** {value}")
        
        st.markdown("---")
        
        # Scrape data button
        st.markdown("### Update Datasets")
        st.write("Click the button below to scrape fresh data from all three sources:")
        
        if st.button("🔄 Scrape Data from All Sources", type="primary"):
            with st.spinner("Scraping data from NCBI, CARD, and PubMLST... This may take a few minutes."):
                scrape_result = call_api("/api/scrape-data", method="POST")
                if scrape_result and scrape_result.get("status") == "success":
                    st.success("✅ Data scraped successfully!")
                    st.rerun()
                else:
                    st.error(f"❌ Error: {scrape_result.get('message', 'Unknown error')}")
    else:
        st.warning("⚠️ Could not load dataset statistics. Make sure the API is running.")
        st.info("💡 Run the scraper script: `python3 scrape_datasets.py`")
        
        if st.button("🔄 Try to Load Statistics"):
            st.rerun()


def safety():
    """Safety section."""
    st.markdown('<div class="section-header">🛡️ Risk Assessment and Safety Statement</div>', unsafe_allow_html=True)
    
    st.write("""
    This project is entirely computational (in silico) and involves no biological materials, hazardous chemicals, or 
    regulated substances. All research was conducted on a standard personal computer using publicly available, anonymized 
    genomic data.
    """)
    
    st.markdown("### Risk Assessment:")
    st.markdown("""
    - **Biological Risk:** None. No live organisms (including MRSA) were cultured or handled. The project is 100% computational.
    - **Data Risk:** Minimal. The project uses public, non-identifiable data. There is no risk to human privacy.
    - **Misuse Risk:** Low. The project predicts existing resistance pathways; it does not generate instructions for creating 
      resistant organisms. The "Limitations and Responsible Use" statement clearly outlines its intended purpose as a predictive, 
      observational tool.
    """)
    
    st.markdown("### SRC/IRB Pre-Approval Statement:")
    st.success("""
    **No SRC/IRB pre-approval was required for this project.**
    
    This research qualifies as having no more than minimal risk. It does not involve human participants, vertebrate animals, 
    potentially hazardous biological agents, or hazardous chemicals, activities, or devices. The work is confined to the 
    analysis of pre-existing, publicly available, and de-identified data, which is exempt from IRB review. All procedures 
    align with the safety guidelines for computational biology projects suitable for a pre-college science competition setting.
    """)


def enhanced_prediction_history():
    """Enhanced prediction history with better display."""
    st.markdown('<div class="section-header">📜 Prediction History</div>', unsafe_allow_html=True)
    st.caption("Review the 10 most recent predictions made by the AI models.")
    
    if st.button("🔄 Refresh History"):
        st.rerun()
    
    result = call_api("/api/predictions?limit=10")
    
    if result and 'predictions' in result:
        predictions = result['predictions']
        if not predictions:
            st.info("No predictions yet. Create a prediction using the AI Tools!")
            return
        
        for pred in predictions:
            pred_type = "Bayesian Network Model" if pred['type'] == 'bayesian' else "Evolutionary Resistance Predictor"
            created_at = pred.get('createdAt', 'Unknown date')
            
            with st.expander(f"🔬 {pred_type} - {created_at}"):
                st.markdown("**Inputs:**")
                input_data = pred.get('input', {})
                for key, value in input_data.items():
                    if value:
                        display_value = ', '.join(value) if isinstance(value, list) else str(value)
                        st.text(f"{key}: {display_value}")
                
                st.markdown("**Outputs:**")
                output = pred.get('output', {})
                
                if pred['type'] == 'bayesian':
                    col1, col2 = st.columns(2)
                    with col1:
                        van_prob = output.get('vancomycinResistanceProbability', 0)
                        st.metric("Vancomycin Resistance", f"{van_prob * 100:.1f}%")
                        st.progress(van_prob)
                    with col2:
                        cef_prob = output.get('ceftarolineResistanceProbability', 0)
                        st.metric("Ceftaroline Resistance", f"{cef_prob * 100:.1f}%")
                        st.progress(cef_prob)
                    
                    if output.get('rationale'):
                        with st.expander("Rationale"):
                            st.write(output['rationale'])
                    
                    if output.get('solution'):
                        with st.expander("Solution"):
                            st.write(output['solution'])
                else:
                    st.write(f"**Prediction:** {output.get('resistancePrediction', 'N/A')}")
                    st.write(f"**Confidence:** {output.get('confidenceLevel', 0) * 100:.1f}%")
                    
                    if output.get('inDepthExplanation'):
                        with st.expander("In-Depth Explanation"):
                            st.write(output['inDepthExplanation'])
                
                # Charts
                if output.get('charts'):
                    st.markdown("**Charts:**")
                    for chart in output['charts']:
                        render_chart(chart, "pie" if len(chart.get('data', [])) <= 3 else "bar")
    else:
        st.warning("Could not load prediction history. Make sure the API is running.")


def main():
    """Main application."""
    # Header
    st.markdown('<div class="main-header">🧬 MRSA Resistance Forecaster</div>', unsafe_allow_html=True)
    st.markdown("### Predicting the Emergence of Antibiotic Resistance in MRSA Using Evolutionary Modeling")
    
    # Sidebar navigation
    page = st.sidebar.selectbox(
        "Navigation",
        [
            "Project Summary",
            "Introduction", 
            "Methodology",
            "AI Tools",
            "Visualizations",
            "Prediction History",
            "Datasets",
            "Impact",
            "Safety"
        ]
    )
    
    if page == "Project Summary":
        project_summary()
    elif page == "Introduction":
        introduction()
    elif page == "Methodology":
        methodology()
    elif page == "AI Tools":
        tab1, tab2 = st.tabs(["🧠 Bayesian Network Modeler", "🧬 Evolutionary Resistance Predictor"])
        with tab1:
            bayesian_prediction_tool()
        with tab2:
            evolutionary_prediction_tool()
    elif page == "Visualizations":
        visualizations()
    elif page == "Prediction History":
        enhanced_prediction_history()
    elif page == "Datasets":
        datasets_section()
    elif page == "Impact":
        impact()
    elif page == "Safety":
        safety()


if __name__ == "__main__":
    main()

