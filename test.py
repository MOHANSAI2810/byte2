import google.generativeai as genai

API_KEY = "AIzaSyCPq7PTGD0b-CGFqlHmCZbOBSW3AFh1a58"

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

response = model.generate_content("Say hello")

print(response.text)