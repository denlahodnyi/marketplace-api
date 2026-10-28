# 01a15501-d3dc-7ba8-9d98-b9c65aa16e8a
# 01a0f36f-82c0-704a-88da-a1c519f6fa34
# 01a0f36f-82c4-7fe4-836b-3dfcb2d03796

curl localhost:3000/cart \
  --json '{"listingId": "01a0f36f-82c4-7fe4-836b-3dfcb2d03796", "quantity": 2}'\
  -w "\nCode: %{http_code}\nURL: %{url}"\
  -H "X-User-Id: 01a0f36f-82b4-7caf-abc9-b6ea879ac6f3"
