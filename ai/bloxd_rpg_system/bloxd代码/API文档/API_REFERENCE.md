# API Reference
## addFollowingEntityToPlayer
Add following entity to player
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
| eId | `EntityId` |  |
| offset | `number[]` |  |
| followsPlayerRotation | `boolean` |  |
 
## addQTE
Create and register the UI for the requested quicktime event (QTE) to the screen.
Handle the result via the onPlayerFinishQTE engine callback.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
| qteParameters | `QTEClientParameters<T>` | includes type and parameters |
### Returns:
`QTERequestId`
 
an id that can be passed to deleteQTE
 
## animateEntity
Animates the given entity.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| entityId | `EntityId` |  |
| animationSchema | `AnimationSchema \| BlockbenchAnimationSchema` |  |
| initialTimeFraction | `number` |  |
| animationSpeed | `number` |  |
 
## applyAuraChange
Add (or remove if negative) aura to a player. Will not go over max level or under 0
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
| auraDiff | `number` |  |
### Returns:
`number`
 
The actual change in aura
 
## applyEffect
Apply an effect to a lifeform.
Can be an inbuilt effect E.g. "Speed" (speed boost), "Damage" (damage boost).
For inbuilt just pass the name of the effect and the functionality is handled in-engine.
For custom effect, you pass customEffectInfo. The icon can be an InGameIconName or a bloxd item name.
The custom effect onEndCb is an optional helper within which you can undo the effect you applied.
Note that onEndCb will not work for press to code boards, code blocks or world code.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| lifeformId | `LifeformId` |  |
| effectName | `string` |  |
| duration | `number \| null` |  |
| customEffectInfo | ` { icon?: IngameIconName \| ItemName; onEndCb?: () => void; displayName?: string \| TranslatedText } & Partial<InbuiltEffectInfo> ` |  |
 
## applyHealthChange
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| lifeformId | `LifeformId` |  |
| changeAmount | `number` | Must be an integer. A positive amount will increase the entity's health. A negative amount will decrease their shield first, then their health. |
| whoDidDamage | ` LifeformId \| { lifeformId: LifeformId; withItem: string } ` | Optional - If damage done by another player |
| broadcastLifeformHurt | `boolean` |  |
### Returns:
`boolean`
 
 
## applyImpulse
Apply an impulse to an entity
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| eId | `EntityId` |  |
| xImpulse | `number` |  |
| yImpulse | `number` |  |
| zImpulse | `number` |  |
 
## applyMeleeHit
Make it as if hittingEId hit hitEId
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| hittingEId | `LifeformId` |  |
| hitEId | `LifeformId` |  |
| dirFacing | `number[]` |  |
| bodyPartHit | `PNull<LifeformBodyPart>` |  |
| overrides | ` { damage?: PNull<number> heldItemName?: PNull<string> horizontalKbMultiplier?: number verticalKbMultiplier?: number } ` |  |
### Returns:
`boolean`
 
 
## attemptApplyDamage
Apply damage to a lifeform.
eId is the player initiating the damage, hitEId is the lifeform being hit.
It is recommended to self-inflict damage when the game code wants to apply damage to a lifeform.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| { eId, hitEId, attemptedDmgAmt, withItem, bodyPartHit = undefined, attackDir = undefined, showCritParticles = false, reduceVerticalKbVelocity = true, horizontalKbMultiplier = 1, verticalKbMultiplier = 1, broadcastEntityHurt = true, attackCooldownSettings = null, hittingSoundOverride = null, ignoreOtherEntitySettingCanAttack = false, isTrueDamage = false, damagerDbId = null, } | `PlayerAttemptDamageOtherPlayerOpts` |  |
### Returns:
`boolean`
 
whether the attack damaged the lifeform
 
## attemptCreateMeshEntity
Try to create a mesh entity. This creates an entity whose mesh position is synced with clients.
Set entity position using setPosition
There is a limit to the number of mesh entities and throwables that can be created, with an even smaller limit for mesh entities with physics.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| type | `MeshType` |  |
| opts | `MeshEntityOpts[MeshType]` |  |
| name | `string` | The default name for the nametag |
| physicsOptions | `MeshEntityPhysicsOpts` | Physics Options |
| initiatorId | `EntityId` | The entity that initiated the creation of the mesh entity. |
### Returns:
`PNull<EntityId>`
 
null if the entity creation failed, otherwise the entity ID.
 
## attemptCreateThrowable
Try to create a throwable entity.
Similar to creating a mesh entity and uses the same rate limiting.
However, this uses the predefined throwables system and physics used by throwable items with the game
Each throwable item has its own behaviour already, including default velocity, damage and gravity multipliers.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| throwerEId | `EntityId` |  |
| itemName | `ThrowableItem` | Must be an Item that is usually throwable in-engine |
| position | `[number, number, number]` | Starting position |
| direction | `[number, number, number]` |  |
| velocityMult | `number` | Multiplier for the default velocity of the throwable item |
| damageMult | `number` | Multiplier for the default damage of the throwable item |
| gravityMult | `number` | Multiplier for the default gravity of the throwable item |
| attributes | `ItemAttributes` | item attributes (currently used only for the "Boomerag" item) |
### Returns:
`string`
 
null if throwable creation failed, otherwise the entity ID.
 
## attemptSpawnMob
Try to spawn a mob into the world at a given position. Returns null on failure.
WARNING: Either the "onPlayerAttemptSpawnMob" or the "onWorldAttemptSpawnMob" game callback will be called
depending on whether "spawnerId" is provided. Calling this function inside those callbacks risks infinite recursion.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| mobType | `TMobType` |  |
| x | `number` |  |
| y | `number` |  |
| z | `number` |  |
| opts | `MobSpawnOpts<TMobType>` | Includes: - mobHerdId The ID of this mob's herd. (A mob herd represents a collection of mobs that move together.) - spawnerId The ID of the player who tried to spawn this mob. - mobDbId A persistent ID for the mob. This can be useful when loading mob data from the database. If the DB ID is already taken, null will be returned. - name If set, gives the mob a name that will be displayed as a nametag above their head. - playSoundOnSpawn - variation - physicsOpts { width: number; height: number; collidesEntities: boolean } |
### Returns:
`PNull<MobId>`
 
null if the mob could not be spawned.
This can happen when there are too many mobs in the world for the current number
of players in the lobby, or if the area is protected e.g. by spawn area protection.
 
## attemptWorldChangeBlock
Initiate a block change "by the world".
This ends up calling the onWorldChangeBlock and only makes the change if not prevented by game/plugins.
initiatorDbId is null if the change was initiated by the game code.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| initiatorDbId | `PNull<PlayerDbId>` |  |
| x | `number` |  |
| y | `number` |  |
| z | `number` |  |
| blockName | `BlockName` |  |
| extraInfo | `WorldBlockChangedInfo` |  |
### Returns:
`"preventChange" | "preventDrop" | void`
 
"preventChange" if the change was prevented, "preventDrop" if the change was allowed but without dropping any items, and undefined if the change was allowed with an item drop
 
## blockCoordToChunkId
Get the unique id of the chunk containing pos in the current map
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| pos | `number[]` |  |
### Returns:
`string`
 
 
## blockIdToBlockName
Goes from block id to block name. The reverse of blockNameToBlockId
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| blockId | `BlockId` |  |
### Returns:
`BlockName`
 
 
## blockNameToBlockId
Get the numeric id of a block used in the ndarrays returned from getChunk
I.e. chunk.blockData.set(x, y, z, api.blockNameToBlockId("Dirt"))
or chunk.blockData.get(x, y, z) === api.blockNameToBlockId("Dirt")
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| blockName | `BlockName` |  |
| allowInvalidBlock | `boolean` | Don't throw an error if the block name is invalid. Defaults false. If true and name is invalid, returns null. |
### Returns:
`PNull<number>`
 
 
## broadcastMessage
Send a message to everyone
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| message | `string \| CustomTextStyling` | The text contained within the message. Can use `Custom Text Styling`. |
| style | ` { fontWeight?: number \| string; color?: string } ` | An optional style argument. Can contain values for fontWeight and color of the message. style is ignored if message uses custom text styling (i.e. is not a string). |
 
## broadcastSound
See documentation for api.playSound
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| soundName | `string` |  |
| volume | `number` |  |
| rate | `number` |  |
| posSettings | ` { playerIdOrPos: PlayerId \| number[] maxHearDist?: number refDistance?: number } ` |  |
| exceptPlayerId | `PlayerId` |  |
 
## calcExplosionForce
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| eId | `EntityId` |  |
| explosionType | `ExplosionType` |  |
| knockbackFactor | `number` |  |
| explosionRadius | `number` |  |
| explosionPos | `number[]` |  |
| ignoreProjectiles | `boolean` |  |
### Returns:
` { force: [number, number, number]; forceFrac: number; } `
 
 
## canOpenStandardChest
Checks if a player is able to open a chest at a given location,
as per the rules laid out by the "onPlayerAttemptOpenChest" game callback.
Returns true if the player can open the chest, false if they cannot, and void if the chest does not exist.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
| chestX | `number` |  |
| chestY | `number` |  |
| chestZ | `number` |  |
### Returns:
`PNull<boolean>`
 
 
## changePlayerIntoSkin
Change a part of a player's skin.
UGC code is restricted to cosmetics from packs with ugcSelectable; internal code can use any cosmetics.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` | Player to change |
| cosmeticType | `CosmeticType` | Type of cosmetic |
| cosmeticName | `CosmeticName` | Chosen cosmetic, will be made lowercase automatically |
 
## checkValid
Check your game (and, optionally, a entity) is still valid and executing.
Useful if you're using async functions and await within your game.
If you use await/async or promises and do not check this, your game could have closed and then the rest of your
async code executes.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| entityId | `PNull<EntityId>` |  |
### Returns:
`boolean`
 
 
## chunkIdToBotLeftCoord
Get the co-ordinates of the block in the chunk with the lowest x, y, and z co-ordinates
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| chunkId | `string` |  |
### Returns:
`[number, number, number]`
 
 
## clearDirectionArrow
Clear a directional arrow from the player's screen.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` | The player to clear the arrow for |
| id | `PNull<string>` | The arrow identifier to clear. If null, clears all arrows for this player. |
 
## clearInventory
Clear the players inventory
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
 
## clearKillstreak
Clears the player's current killstreak
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
 
## closeChestForPlayer
Close a chest for a player.
If the player does not have a chest open, do nothing.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
 
## configureShopCategory
Set properties of a shop category.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| categoryKey | `ShopCategoryKey` | The key of the category to configure |
| config | `ShopCategoryConfig` | Category configuration properties |
 
## configureShopCategoryForPlayer
Configure a shop category for a specific player.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` | The player to configure the category for |
| categoryKey | `ShopCategoryKey` | The key of the category to configure |
| config | `ShopCategoryConfig` | Category configuration properties |
 
## createItemDrop
Create a dropped item.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| x | `number` |  |
| y | `number` |  |
| z | `number` |  |
| itemName | `ItemName` | Name of the item. Any item name, including blocks and 'Air' |
| amount | `PNull<number>` | The amount of the item to include in the drop - so when the player picks up the item drop, they get this many of the item. |
| mergeItems | `boolean` | Whether to merge the item into a nearby item of same type, if one exists. Defaults to false. |
| attributes | `ItemAttributes` | Attributes of the item being dropped |
| timeTillDespawn | `number` | Time till the item automatically despawns in milliseconds. Max of 5 mins. |
| dropperId | `PNull<LifeformId>` | Who dropped the item. |
| options | `ItemDropOptions` | Additional options, such as doPhysics and size. |
### Returns:
`PNull<EntityId>`
 
the id you can pass to setCantPickUpItem, or null if the item drop limit was reached
 
## createMobHerd
Create a mob herd. A mob herd represents a collection of mobs that move together.
### Returns:
`MobHerdId`
 
 
## createShopItem
Create a new shop item under the given category.
Will create a new category if it does not exist.
If the shop item already exists then it will be replaced.
If any per-player overrides exist under the same categoryKey and itemKey then they will be deleted.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| categoryKey | `ShopCategoryKey` | The key of the category to create the item in |
| itemKey | `ShopItemKey` | The unique key for the item |
| item | `ShopItem` | The shop item to create (will be mutated) |
 
## createShopItemForPlayer
Create a new shop item for a specific player.
Will create a new category if it does not exist.
Will replace any overrides this player already has for the same item.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` | The player to create the item for |
| categoryKey | `ShopCategoryKey` | The key of the category to create the item in |
| itemKey | `ShopItemKey` | The unique key for the item |
| item | `ShopItem` | The shop item to create (will be mutated) |
 
## deleteAllLobbyDbValues
Deletes all database values that are saved per lobby.
 
## deleteAllPlayerDbValues
Deletes all database values that are saved per player.
### Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| playerId | `PlayerId` |  |
 
## deleteItemDrop
