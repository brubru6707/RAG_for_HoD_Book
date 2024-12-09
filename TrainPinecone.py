from pinecone import Pinecone
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from openai import OpenAI
from config import OPENAI_API_KEY, PINECONE_API_KEY


# Initialize ChatGPT
client = OpenAI(api_key=OPENAI_API_KEY)
# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("handfullofdust")
# index_description = pc.describe_index("handfullofdust")

# Extract text from PDF
def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

# Chunk text into segments
def chunk_text(text, max_tokens=500):
    """Split text into manageable chunks for embeddings."""
    sentences = text.split(". ")
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_tokens:
            current_chunk += sentence + ". "
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

# Generate embeddings using OpenAI
def generate_embedding(text):
    """Generate embeddings using OpenAI's embeddings API."""
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

# Process and upsert data into Pinecone
def index_pdf_to_pinecone(pdf_path):
    """Extract PDF text, chunk it, generate embeddings, and upload to Pinecone."""
    text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(text)

    for i, chunk in enumerate(chunks):
        embedding = generate_embedding(chunk)  # Generate embedding for each chunk
        index.upsert([(f"chunk-{i}", embedding, {"text": chunk})])
    print(f"Indexed {len(chunks)} chunks to Pinecone.")

# Query Pinecone and fetch context chunks
def query_pinecone(query_text):
    """Query Pinecone index for relevant context chunks."""
    query_embedding = generate_embedding(query_text)
    response = index.query(
        vector=query_embedding,
        top_k=5,  # Number of relevant results to fetch
        include_values=False,  # We only need metadata/context text
        include_metadata=True,
    )

    # Extract the text data from the response
    relevant_contexts = [match['metadata']['text'] for match in response['matches']]
    return relevant_contexts


# Generate response using OpenAI GPT with context
def ask_openai_with_context(query_text):
    """Query Pinecone, then pass retrieved context to OpenAI for generating a response."""
    # Fetch relevant context chunks from Pinecone
    contexts = query_pinecone(query_text)

    # Combine contexts into one context string
    context_str = "\n".join(contexts)

    # Prompt to pass into GPT
    prompt = f"Based on the following context, answer the question:\n\n{context_str}\n\nQuestion: {query_text}\nAnswer:"

    # Send the prompt to OpenAI
    openai_response = client.chat.completions.create(
        model="gpt-4o",  # Or `gpt-4` depending on your access
        messages= [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": prompt
              }
            ]
          }
        ]
    )

    # Extract and print the response
    generated_answer = openai_response
    # print('this is the prompt: ' + prompt)
    print("Answer from OpenAI:\n", generated_answer.choices[0].message.content)


# Example workflow
pdf_path = "handfuldust.pdf"

# Index the book to Pinecone (only needs to be run once!)
#index_pdf_to_pinecone(pdf_path)


query_text = """
THESE ARE CHAPTER 4 QUESTIONS

Who seems to be the only person concerned about Brenda's affair with John Beaver?


The cook.


Allan.


Tony.


Marjorie.

Question at position 2
2
 
Multiple Choice 
20 points 

 
 
Question at position 2 
How long before Brenda returns to Hetton again?


A month.


A day.


A week.


Never.

Question at position 3
3
 
Multiple Choice 
20 points 

 
 
Question at position 3 
What has Jenny inadvertently renamed Tony?


Theodore.


Antonio.


Teddy.


Tosca.

Question at position 4
4
 
Multiple Choice 
20 points 

 
 
Question at position 4 
Why does Brenda send Jenny Abdul Akbar ahead to Hetton?


Because she can get away from London sooner that the others.


All three women come to the estate together.


So maybe Tony will feel attracted to her.


Brenda is hoping to catch Tony in a compromising position.

Question at position 5
5
 
Multiple Choice 
20 points 

 
 
Question at position 5 
When Brenda finally communicates with Tony, what does she tell him?

That John Andrew is to be sent to her.


That she is divorcing Tony.


That she is in love with another man.


That she will be visiting that weekend.
"""

ask_openai_with_context(query_text)