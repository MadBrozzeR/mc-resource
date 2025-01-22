const URL = {
  MANIFEST: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
  ASSETS: 'https://resources.download.minecraft.net/${short}/${hash}',
  UUID: 'https://api.mojang.com/users/profiles/minecraft/${name}',
  UUID_TIME: 'https://api.mojang.com/users/profiles/minecraft/${name}?at=${timestamp}',
  NAMES: 'https://api.mojang.com/user/profiles/${uuid}/names',
  UUIDS: 'https://api.mojang.com/profiles/minecraft',
  PROFILE: 'https://sessionserver.mojang.com/session/minecraft/profile/${uuid}',
  SKIN: 'https://api.mojang.com/user/profile/${uuid}/skin',
  AUTH: 'https://authserver.mojang.com'
};

const JSON_CT = {contentType: 'application/json'};

module.exports = {
  URL,
  JSON_CT,
}
