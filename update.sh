#!/usr/bin/env bash
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'
DARK_GRAY='\033[1;90m'

echo -e "${DARK_GRAY}# # # # # # # # # # # # # # # # # #${RESET}"
echo -e "${DARK_GRAY}#${RESET}   ${YELLOW}╦${RESET}┌─┐┌─┐┌┐┌  ${YELLOW}╦═╗${RESET}┌─┐┌─┐┬┌┐┌┌─┐${RESET}"
echo -e "${DARK_GRAY}#${RESET}   ${YELLOW}║${RESET}├┤ ├─┤│││  ${YELLOW}╠╦╝${RESET}├─┤│  ││││├┤${RESET}"
echo -e "${DARK_GRAY}#${RESET}  ${YELLOW}╚╝${RESET}└─┘┴ ┴┘└┘  ${YELLOW}╩╚═${RESET}┴ ┴└─┘┴┘└┘└─┘${RESET}"
echo -e "${DARK_GRAY}#  ${YELLOW}Root-Me${DARK_GRAY} and CTF ${YELLOW}Discord${DARK_GRAY} bot${RESET}"
echo -e "${DARK_GRAY}#  by ${YELLOW}kernoeb${RESET}"
echo -e "${RESET}"

# Avoid a h4ck3r to edit the path
PATH=$(/usr/bin/getconf PATH || /bin/kill $$)

ctrl_c () {
    echo -e "${RED}[X]${RESET} CTRL+C detected..."
    exit 1
}

trap ctrl_c INT

if [ -x "$(command -v docker)" ]; then
    if [ "$(docker -v | cut -d ' ' -f 3 | cut -d '.' -f 1)" -lt "20" ]; then
        echo -e "${RED}[!]${RESET} Docker version : $(docker -v)${RESET}"
        echo -e "${RED}[-] Docker version is inferior to 20.${RESET}"
        echo -e "${RED}[-] Please update your docker version.${RESET}"
        exit 1
    fi

    docker run --rm curlimages/curl --silent --output /dev/null --show-error https://discord.com || {
        echo -e "${RED}[!]${RESET} Unable to connect to Discord.com inside a container, make sure Docker can access the internet."
        exit 1
    }

    if docker compose version 1>/dev/null 2>/dev/null; then
        DOCKER_COMPOSE_COMMAND="docker compose"
    elif docker-compose version 1>/dev/null 2>/dev/null; then
        DOCKER_COMPOSE_COMMAND="docker-compose"
    else
        echo -e "${RED}[!]${RESET} Docker-compose not found."
        echo -e "${RED}[-] Please install docker-compose.${RESET}"
        exit 1
    fi

    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}[!]${RESET} docker-compose.yml not found."
        echo -e "${YELLOW}[?] Get it from : https://raw.githubusercontent.com/kernoeb/jean_racine_bot/main/docker-compose.yml${RESET}"
        exit 1
    fi

    if [ ! -f ".env" ]; then
        echo -e "${RED}[!]${RESET} .env file not found."
        exit 1
    fi

    DOCKER_COMPOSE_VERSION_PART_1="$($DOCKER_COMPOSE_COMMAND version --short | cut -d '.' -f 1)"
    DOCKER_COMPOSE_VERSION_PART_2="$($DOCKER_COMPOSE_COMMAND version --short | cut -d '.' -f 2)"
    DOCKER_COMPOSE_VERSION_PART_2="$(printf "%02d" "$DOCKER_COMPOSE_VERSION_PART_2")"

    # check if docker compose version is greater than or equal to 129
    if [ "$DOCKER_COMPOSE_VERSION_PART_1$DOCKER_COMPOSE_VERSION_PART_2" -lt "129" ]; then
        echo -e "${RED}[!]${RESET} Docker compose version : $($DOCKER_COMPOSE_COMMAND version)${RESET}"
        echo -e "${RED}[-] Docker compose version is inferior to 1.29.${RESET}"
        echo -e "${RED}[-] Please update your docker compose version.${RESET}"
        exit 1
    fi

    echo -e "${YELLOW}[+]${RESET} Pulling latest images..."
    $DOCKER_COMPOSE_COMMAND pull || exit 1

    echo -e "${YELLOW}[+]${RESET} Updating images..."
    $DOCKER_COMPOSE_COMMAND up -d --remove-orphans --build || exit 1
else
    echo -e "${RED}[-]${RESET} Docker is not installed, please install it first."
    exit 1
fi
