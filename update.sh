#!/usr/bin/env bash
# # # # # # # # # # # # # # # # #
#  ╦┌─┐┌─┐┌┐┌  ╦═╗┌─┐┌─┐┬┌┐┌┌─┐
#  ║├┤ ├─┤│││  ╠╦╝├─┤│  ││││├┤
# ╚╝└─┘┴ ┴┘└┘  ╩╚═┴ ┴└─┘┴┘└┘└─┘
#  Root-Me and CTF Discord bot
#  by kernoeb

RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

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

    echo -e "${YELLOW}[+]${RESET} Pulling latest images..."
    $DOCKER_COMPOSE_COMMAND pull || exit 1

    echo -e "${YELLOW}[+]${RESET} Updating images..."
    $DOCKER_COMPOSE_COMMAND up -d --remove-orphans --build || exit 1
else
    echo -e "${RED}[-]${RESET} Docker is not installed, please install it first."
    exit 1
fi
