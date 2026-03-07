import os

from database import init_db
from mcp_instance import mcp

init_db()

if __name__ == "__main__":
    host = os.getenv("MCP_HOST", "127.0.0.1")
    port = int(os.getenv("MCP_PORT", "8000"))
    mcp.run(transport="streamable-http", host=host, port=port)
