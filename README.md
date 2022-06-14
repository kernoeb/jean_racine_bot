# Jean Racine
### RootMe bot

Root-Me Discord using `Discord.js` and `Slash Commands`.  
built by `@kernoeb`

### Features

- Add user / Remove user
- Scoreboard with auto update / refresh
- Notifications (new challenge added or succeed, new validation, new solution)
- Search a user or a challenge id
- Information about a challenge or a user

### Commands

`/init`: Initialize the bot in the canal  
`/adduser` : Add a user  
`/deluser` : Delete a user  
`/scoreboard` : Scoreboard  
`/searchuser` : Search a user  
`/challenge <id>` : Search and information about a challenge  
`/user <id>`: Information about a user  
`/createglobalscoreboard` : Add a global scoreboard  
`/getlastchallenges` : Get last challenges  
`/ping`: Test if the bot is not down

### Captures

**Global Scoreboard**

![Global Scoreboard](images/global_scoreboard.png)

**Notifications**

![Notifications 1](images/notifications_1.png)

![Notifications 2](images/notifications_2.png)

**Information about a user**

![User info](images/img4.png)

**Information about a challenge**

![Challenge info](images/challenge.png)

**Scoreboard with arrows**

![Arrow scoreboard](images/arrow_scoreboard.png)

**Last challenges**

![Last challenges](images/last_challenges.png)

**Charts**

![img.png](images/chart.png)


### Installation

- Get an API Key on Root-Me [here](https://www.root-me.org/?page=preferences)
- Copy `.env.example` to `.env` and replace variables

> API_KEY is the main Root-Me API Key (premium is better!).  
> API_KEY_FIRST can be used to get all non-premium challenges, to avoid lot of requests on your account  
> You can use an api key or a cookie

```bash
mkdir -p /opt/jeanracine
chown -R 1001 /opt/jeanracine
docker-compose pull && docker-compose up -d --build
```

> You can also use my published docker image, instead of build the Dockerfile  
> `image: ghcr.io/kernoeb/jean_racine_bot:main`

- Wait for the bot to load all the challenges (it can take a long time)
- Refresh Discord slash commands

```bash
docker exec -it <name-of-jean-racine-container> register_slash_commands
```

#### Optional :

Add this to your `.bashrc` :

```
function jeanracinelogs() {
  if [ $# -eq 0 ]
  then
      docker logs jean_racine_bot_rootme_node_1 --tail 20 -f
  else
      docker logs jean_racine_bot_rootme_node_1 --tail $1 -f
  fi
}
```

Open a new terminal, then try `jeanracinelogs`.

If this does not work -> `kernoeb#7737` on Discord, [@kernoeb](https://t.me/kernoeb) on Telegram :)

### Similar projects

- [RootMeBotV2](https://github.com/slowerzs/RootMeBotV2/) - Slowerzs
