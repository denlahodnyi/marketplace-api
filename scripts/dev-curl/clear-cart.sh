curl localhost:3000/cart \
  -X DELETE \
  -w "Code: %{http_code}" \
  -H "X-User-Id: 01a0f36f-82b4-7caf-abc9-b6ea879ac6f3"
