from transformers import pipeline

# Use your model's ID from the Hub
pipe = pipeline("text-classification", model="George-Wallden/llm-detector")

# Test with some text
result = pipe("I think the New Jersey devils really stink. They almost got swept in the first round. Holy smokes they crashed and burned. The hot dogs at the rock are a third the diameter of the ones at MSG")
print(result)

result = pipe("To optimize the synergistic core competencies, we must leverage our agile frameworks to empower the value-added deliverables.")
print(result)