#!/bin/bash
# YAZ MINECRAFT SERVER PROVISIONER
# Target: Lightweight PaperMC with GeyserMC and RCON Enabled

MC_DIR="$HOME/yaz_workspace/minecraft"
mkdir -p "$MC_DIR/plugins"

echo "[INIT] Fetching the latest PaperMC server core (Java)..."
# Downloads the lightweight, highly optimized Paper server jar
curl -L -o "$MC_DIR/paper.jar" "https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/496/downloads/paper-1.20.4-496.jar"

echo "[INIT] Fetching GeyserMC (Allows Bedrock Chromebook Client to connect)..."
curl -L -o "$MC_DIR/plugins/Geyser-Spigot.jar" "https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot"

echo "[INIT] Creating eula.txt to accept Minecraft's terms..."
echo "eula=true" > "$MC_DIR/eula.txt"

echo "[INIT] Generating pre-configured server.properties with secure RCON..."
cat << 'PROP_EOF' > "$MC_DIR/server.properties"
# Minecraft Server Properties - YAZ Pre-configured
enable-rcon=true
rcon.port=25575
rcon.password=yaz_secure_password
server-port=25565
online-mode=false
view-distance=6
simulation-distance=4
max-players=2
PROP_EOF

echo "[INIT] Sourcing RCON parameters directly to YAZ vault..."
cat << 'KEYS_EOF' >> ~/vault/keys.env

# YAZ Local RAG Minecraft RCON Bridge Coordinates
export MC_RCON_HOST='127.0.0.1'
export MC_RCON_PORT='25575'
export MC_RCON_PASSWORD='yaz_secure_password'
KEYS_EOF

echo "================================================================"
echo "[SUCCESS] Local PaperMC server successfully provisioned."
echo "----------------------------------------------------------------"
echo "To run the server without crashing your Chromebook (RAM Cap: 1GB):"
echo "   cd $MC_DIR && java -Xms512M -Xmx1024M -jar paper.jar nogui"
echo "----------------------------------------------------------------"
echo "Coordinates for your Bedrock client connection:"
echo "   Server IP/Host: 127.0.0.1"
echo "   Port: 19132"
echo "================================================================"
