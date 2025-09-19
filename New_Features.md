# Classifyinator3000 - Exciting New Features!

Here is a video demo - Showing off the new features.

[Youtube Video Demo!](https://youtu.be/QzV69UpXK7c)

## 🧠 Smarter Chunking & Classification Deep Dive

We've completely revamped our text chunking strategy to be more intelligent and context-aware, leading to more accurate classifications.

### The New Process:

1.  **Paragraph-First Splitting**: Instead of arbitrary splits, we first divide the document into paragraphs.
2.  **Semantic Merging**: We then compute the cosine similarity between neighbouring paragraphs. If they are semantically similar (above a defined threshold), we merge them. This keeps related content together.
3.  **Token-Aware Resizing**: Finally, we use the model's own tokenizer to ensure each chunk is an appropriate size for processing. If a merged chunk is too large, it's broken down into smaller pieces.

This new approach ensures that the context of your document is better preserved, leading to significantly improved classification results.

### Classification Deep Dive

To give you full transparency into the classification process, you can now perform a "deep dive" on any classified file. This new view shows you:

- How the document was chunked.
- The top classification label and score for each individual chunk.

This allows you to understand exactly how the model arrived at its final conclusion.

## 🚀 Enhanced Performance & Resource Management

We've made significant backend improvements to make the application faster and more efficient.

### Optimized Model Loading

Models are now pre-loaded on startup by dedicated Celery workers and stored in an LRU (Least Recently Used) cache. This means:

- **No More Cold Starts**: The API is immediately ready to process your documents without waiting for models to download.
- **Faster Classifications**: Subsequent requests are much faster as the model is already in memory.
- **Responsive API**: The main FastAPI thread remains unblocked and responsive.

### GPU Acceleration with CPU Fallback

The system now automatically detects if a GPU is available and will use it to run the classification models. This provides a massive speed boost for users with capable hardware. If no GPU is found, it seamlessly reverts to using the CPU, ensuring the service is accessible to everyone.

## 🎛️ Greater User Control and Flexibility

We've added several features to give you more control over the classification process and your data.

### Model Selection

You are no longer limited to a single model! When processing a file, you can now choose from a selection of curated zero-shot classification models. This allows you to experiment and find the perfect balance between speed and accuracy for your specific needs.

### Delete Files

You now have the ability to delete uploaded files and their associated classification results from the system. This gives you complete control over managing your documents.

## 🛡️ Improved Robustness and Security

### Mimetype Validation

To make file uploads safer and more reliable, we've implemented robust mimetype checking on the backend.

- The system now uses a library to inspect the file's binary content to determine its true mimetype.
- It compares this "real" mimetype with the file extension provided by the client.
- If there is a mismatch (e.g., a `.txt` file that is actually an executable), the upload is rejected and an error is returned.

This prevents processing errors and adds a layer of security against potentially malicious files.
