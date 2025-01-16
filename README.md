# DDB Back End Developer Challenge

### Completed
To complete this challenge, I opted to use React Routes to set up a local API that implements the requested functions.
In addition, I've added some simple button features to enable faster testing of the API's functionality.

**Additional functionality implemented:**
* A basic roller which utilizes a uniform distribution model paired with a MersenneTwister(19937) algorithm. The roller is used in the Update HP test buttons to set a random value on each visit to the Update HP view. The Roller is pre-configured to roll 2d6, but can be modified to roll any number of dice and apply modifiers.
* Equip/Unequip of all items. From the Get Data view, you can equip or unequip all items. Only the constitution modifer is functional in terms of impact as this demo focuses on hit points.

This repo contains the node_modules directory tree which wouldn't normally be included, but rather than require the reviewer(s) to install modules, I've included the director for ease of access.

### Routes definied
**API Routes:**
* **/** - The root route provides an API overview and example queries.
* **/api/get**  - Loads and displays character data from json or session. To force a reload - add a &reload=true as a param. 
* **/api/del**	- Delete session data
* **/api/hp**	- Manipulate hit point related things. 
* * ex. **/api/hp?key=briv.json&type=healing&value=10**
* * ex. **/api/hp?key=briv.json&type=tempHP&value=8**
* * ex. **/api/hp?key=briv.json&type=fire&value=12**
* **/api/equip**- Equip or Unequip all gear. This can be extended to specific gear as needed.
* * ex. **/api/equip?key=briv.json&equip=true** -- equip all gear
* * ex. **/api/equip?key=briv.json&equip=false** -- unequip all gear

**Notes**
* all routes can take a key as input where key=<json file name>. However, only the /get route will use this key to load from file into session storage.
* there is no UI to change the dice pool for the /hp demo buttons.

### Overview
This task focuses on creating an API for managing a player character's Hit Points (HP) within our game. The API will enable clients to perform various operations related to HP, including dealing damage of different types, considering character resistances and immunities, healing, and adding temporary Hit Points. The task requires building a service that interacts with HP data provided in the `briv.json` file and persists throughout the application's lifetime.

### Task Requirements

#### API Operations
1. **Deal Damage**
    - Implement the ability for clients to deal damage of different types (e.g., bludgeoning, fire) to a player character.
    - Ensure that the API calculates damage while considering character resistances and immunities.

    > Suppose a player character is hit by an attack that deals Piercing damage, and the attacker rolls a 14 on the damage's Hit Die (with a Piercing damage type). `[Character Hit Points - damage: 25 - 14 = 11]`

2. **Heal**
    - Enable clients to heal a player character, increasing their HP.

3. **Add Temporary Hit Points**
    - Implement the functionality to add temporary Hit Points to a player character.
    - Ensure that temporary Hit Points follow the rules: they are not additive, always taking the higher value, and cannot be healed.

    > Imagine a player character named "Eldric" currently has 11 Hit Points (HP) and no temporary Hit Points. He finds a magical item that grants him an additional 10 HP during the next fight. When the attacker rolls a 19, Eldric will lose all 10 temporary Hit Points and 9 from his player HP.

#### Implementation Details
- Build the API using either C# or NodeJS.
- Ensure that character information, including HP, is initialized during the start of the application. Developers do not need to calculate HP; it is provided in the `briv.json` file.
- Retrieve character information, including HP, from the `briv.json` file.


#### Data Storage
- You have the flexibility to choose the data storage method for character information.

### Instructions to Run Locally
1. Clone the repository or obtain the project files.
2. Install any required dependencies using your preferred package manager.
3. Configure the API with necessary settings (e.g., database connection if applicable).
4. Build and run the API service locally.
5. Utilize the provided `briv.json` file as a sample character data, including HP, for testing the API.

### Additional Notes
- Temporary Hit Points take precedence over the regular HP pool and cannot be healed.
- Characters with resistance take half damage, while characters with immunity take no damage from a damage type.
- Use character filename as identifier

#### Possible Damage Types in D&D
Here is a list of possible damage types that can occur in Dungeons & Dragons (D&D). These damage types should be considered when dealing damage or implementing character resistances and immunities:
- Bludgeoning
- Piercing
- Slashing
- Fire
- Cold
- Acid
- Thunder
- Lightning
- Poison
- Radiant
- Necrotic
- Psychic
- Force

If you have any questions or require clarification, please reach out to your Wizards of the Coast contact, and we will provide prompt assistance.

Good luck with the implementation!
