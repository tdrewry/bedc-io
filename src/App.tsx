import {useEffect, useState} from 'react'
import './App.css'
import {BrowserRouter as Router, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {integer, MersenneTwister19937} from 'random-js';

// Data - START
type Stats = Record<string, number> ;

/**
 * Character Data - the core data structure for storing character data. Includes all fields from the sample json 
 * as well as the tempHitPoints and currentHitPoints extensions used for managing damages and hp related tasks.
 */
interface CharacterData {
    name: string;
    level: number;
    hitPoints: number;
    modifiedHitPoints: number;
    tempHitPoints: number;
    currentHitPoints: number;
    classes: {
        name: string;
        hitDiceValue: number;
        classLevel: number;
    }[];
    stats: Stats;
    items: {
        name: string;
        modifier: {
            affectedObject: string;
            affectedValue: string;
            value: number;
        };
        equipped: number;
    }[];
    defenses: {
        type: string;
        defense: string;
    }[];
}
// END - Character Data

// Roller - START
/**
 * RollDice is the core function for generating dice rolls. I built this function to generate rolls using 
 * a MersenneTwister(19937) algorithm in conjunction with a Uniform distribution pattern. I have not tested this
 * implementation thoroughly, but it worked well enough for this project.
 * 
 * This is set up to attach the modifer as a final "roll" value in the value array returned. So if you rolled 2d6+8 you
 * could end up with [3, 5, 8] as your output where 8 is the modifier.
 *
 * @param num - number of dice to roll
 * @param sides - number of sides of the dice to roll 
 * @param modifier - modifier to apply to this roll
 * @returns rolls - this method returns an array of dice rolled post pended with the modifier.
 */
const RollDice = (num: number, sides: number, modifier: number = 0): number[] => {
    
    var rollResult : number = 0;
    var rolls : number[] = [];

    const engine = MersenneTwister19937.autoSeed();
    
    const generateRandom = () => {
        
        const distribution = integer(1, sides);
        
        for(let i = 0; i < num; i++) {
            const number = distribution(engine);
            
            rolls = [...rolls, number];
            
            rollResult += number;
        }
    };
    
    generateRandom();
    
    const intervalId = setInterval(generateRandom, 1000);
    
    clearInterval(intervalId);

    rolls = [...rolls, modifier];
    
    return rolls;
}

/**
 * A wrapper for RollDice built to roll a single type of die and return the total result.
 * 
 * @param num - number of dice to roll
 * @param sides - number of sides per die
 * @param modifier - modifier to the roll (default: 0)
 * @returns sum - the total of the result array including the modifier.
 */
const GetRollTotal = (num: number, sides: number, modifier: number = 0): number => {
    let result = RollDice(num, sides, modifier);
    let sum: number = 0;
    result.forEach((roll) => {
        sum += +roll;
    })
    return +sum;
}
// END - Random Numbers

// SESSION HANDLING - START

/**
 * Session utility to fetch session data. *fallback* is a bit of a hack to ensure that a generic is provided if 
 * there is a problem loading character data.
 * 
 * @param key - the session data key
 * @returns data - returns the current known Character Data
 */
const getSessionData = (key: string) => {
    const data = sessionStorage.getItem(key.toLowerCase());
    
    const fallback: CharacterData = { 
        name: '',
        level: 0,
        hitPoints: 0,
        modifiedHitPoints: 0,
        tempHitPoints: 0,
        currentHitPoints: 0,
        classes: [],
        items: [],
        defenses: [],
        stats: {},
    };
    
    return data ? JSON.parse(data) as CharacterData : fallback;
};

/**
 * Session utility to set/save the session data to the browser session.
 * 
 * @param key - session data key
 * @param value - the session data itself (CharacterData)
 */
const setSessionData = (key: string, value: CharacterData) => {
    sessionStorage.setItem(key.toLowerCase(), JSON.stringify(value) );
};

/**
 * Session utility to clear/delete the current session data. Once cleared in this way, a reload is required to
 * repopulate the data
 * 
 * @param key - session data key
 */
const deleteSessionData = (key: string) => {
    sessionStorage.removeItem(key.toLowerCase());
};
// END - SESSION HANDLING

// DATA MANAGEMENT/ROUTE TARGETS - START

const EquipItems = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const key = params.get('key') || 'briv.json';
    const equip = params.get('equip') || 'true';
    
    useEffect(() => {
        // check for existing character data
        const storedData = getSessionData(key);


        let hpMod: number = 0;
        storedData.items.forEach((item) => {
            // lets unequip the item and remove the impact.
            if (item.modifier.affectedObject === "stats")
                if (item.modifier.affectedValue === "constitution") {
                    hpMod = +storedData.level * +Math.max(Math.floor(+item.modifier.value / +2), 0);
                }
            
            if (equip === 'true') {
                if (item.equipped === 0) {
                    item.equipped = 1;
                    storedData.modifiedHitPoints += +hpMod;
                    storedData.currentHitPoints += +hpMod;
                    console.log(`Equipped ${item.name}`);
                }    
            } else {
                if (item.equipped === 1) {
                    item.equipped = 0;
                    storedData.modifiedHitPoints -= +hpMod;
                    storedData.currentHitPoints -= +hpMod;
                    console.log(`Unequipped ${item.name}`);
                }
            }
            
            console.log(`modified hp: ${storedData.modifiedHitPoints}`);
            console.log(`current hp: ${storedData.currentHitPoints}`);
        });
        setSessionData(key, storedData);

    }, [key, equip]);

    return (
        <div>
            <button onClick={() => navigate('/')}>API Overview</button>
            -
            <button onClick={() => navigate('/api/get?key=briv.json')}>Get Data</button>
            <button onClick={() => navigate('/api/hp')}>Update HP</button>
            -
            <button onClick={() => navigate('/api/del?key=briv.json')}>Delete Data</button>
            <h2>GET Data</h2>
            <a href='/api/get?key=briv.json'>
                <button>View Data</button>
            </a>
        </div>
    );
}

/**
 * GetData is the primary loader Route for this application. It fetches data from JSON or from Session Storage. 
 * GetData is also responsible for ensuring that our additional hp fields are initialized.
 *
 * @param key - the session data key
 * @param reload - a simple flag to issue a forced reload of data
 */
const GetData = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const key = params.get('key') || 'briv.json';
    const reload = params.get('reload') || undefined;
    const [jsonData, setJsonData] = useState<CharacterData>();

    useEffect(() => {
        // check for existing character data
        const storedData = getSessionData(key);
        
        // use what we found or reload on request
        if (storedData && !reload) {
            console.log(`using ${storedData.name} from session ${key}.`);
            
        } else {

            /**
             * Simple json loader with data manipulation to add additional fields and initialize their values.
             * @param file - the path and file name to load. Currently this is handled via a pre-set filePath var, but 
             * it can be easily adapted to take a filePath as input.
             */
            const loadJson = async (file: string) => {
                try {
                    const response = await fetch(file); // Fetch the JSON file from the public folder
                    if (!response.ok) throw new Error('Failed to fetch JSON file');
                    const data = await response.json() as CharacterData;
                    data.tempHitPoints = 0;
                    // adds and equipped state to items. this could be saved to the json and reloaded. for now. we just
                    // unequip all items as we have no persistent storage for this state.
                    data.items.forEach((item) => { item.equipped = 0; });
                    
                    data.modifiedHitPoints = +data.hitPoints;
                    data.currentHitPoints = +data.modifiedHitPoints;
                
                    setJsonData(data);
                    console.log('loaded ' + data.name + ' from json.');
                    setSessionData(key, data);
                } catch (error) {
                    console.error(error);
                }
            };

            // read from known json source using preset filePath var...
            loadJson(filePath);
        }
    }, [key, reload]);

    // fetch the resulting session data for use in the render
    const sessionData = getSessionData(key);

    return (
        <div>
            <button onClick={() => navigate('/')}>API Overview</button>
            -
            <button onClick={() => navigate('/api/get?key=briv.json')}>Get Data</button>
            <button onClick={() => navigate('/api/hp')}>Update HP</button>
            -
            <button onClick={() => navigate('/api/del?key=briv.json')}>Delete Data</button>
            <h2>GET Data</h2>
            <a href='/api/get?key=briv.json&reload=true'>
                <button>Reload</button>
            </a>
            <a href='/api/equip?key=briv.json&equip=true'>
                <button>Equip Gear</button>
            </a>
            <a href='/api/equip?key=briv.json&equip=false'>
                <button>Unequip Gear</button>
            </a>
            <h3>Session Data ({key}):</h3>
            <pre>
                <div>
                    <h2>Character Data:</h2>
                    {sessionData ? (
                        <div>

                            <p>Name: {sessionData.name}</p>
                            <p>Level: {sessionData.level}</p>
                            <p>Hit Points (base): {sessionData.hitPoints}</p>
                            <p>Hit Points (modified): {sessionData.modifiedHitPoints}</p>
                            <p>Current Hit Points: {sessionData.currentHitPoints}</p>
                            <p>Temporary Hit Points: {sessionData.tempHitPoints}</p>

                            <h4>Classes:</h4>
                            <ul>
                                {sessionData.classes.map((charClass: any, index: number) => (
                                    <li key={index}>
                                        {charClass.name} (Level {charClass.classLevel}, Hit Dice:
                                        d{charClass.hitDiceValue})
                                    </li>
                                ))}
                            </ul>

                            <h4>Stats:</h4>
                            <ul>
                                {Object.entries(sessionData.stats).map(([stat, value]) => (
                                    <li key={stat}>
                                        {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value as number}
                                    </li>
                                ))}
                            </ul>

                            <h4>Items:</h4>
                            <ul>
                                {sessionData.items.map((item: any, index: number) => (
                                    <li key={index}>
                                        {(item.equipped > 0) ? '[Equipped]' : '[Unequipped]'} - {item.name} (Affects {item.modifier.affectedObject} - {item.modifier.affectedValue}:
                                        +{item.modifier.value})
                                    </li>
                                ))}
                            </ul>

                            <h4>Defenses:</h4>
                            <ul>
                                {sessionData.defenses.map((defense: any, index: number) => (
                                    <li key={index}>
                                        {defense.type.charAt(0).toUpperCase() + defense.type.slice(1)}: {defense.defense}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>Loading or No Data Found</p>
                    )}
                </div>
            </pre>
            <hr/>
            <h3>JSON File Data:</h3>
            <pre>{jsonData ? 'This data has two additional fields added in code on parse: currentHitPoints and tempHitPoints.\nThese are used to track changes to the HP and manage temps during the session.\n\n ' + JSON.stringify(jsonData, null, 2) : 'Data already loaded.\nAdd &reload=true to refresh from source.'}</pre>
        </div>
    );
};

/**
 * DeleteData is the Route which clears session data.
 *
 * @param key - the session data key
 */
const DeleteData = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const key = params.get('key') || 'briv.json';

    // simple call to remove session data based on provided key.
    deleteSessionData(key);
    return (
        <div>
            <button onClick={() => navigate('/')}>API Overview</button>
            -
            <button onClick={() => navigate('/api/get?key=briv.json')}>Get Data</button>
            <button onClick={() => navigate('/api/hp')}>Update HP</button>
            -
            <button onClick={() => navigate('/api/del?key=briv.json')}>Delete Data</button>
            <h2>DELETE Data</h2>
            <p>Data deleted for key: {key}</p>
            <hr/>
            <pre><a href='/api/get?key=briv.json&reload=true'><button><code>Restart App</code></button></a></pre>
        </div>
    )
};

/**
 * a utility function to check defense vs type and return any valid defense type. 
 * 
 * @param data - the character data to reference, this could be done with just the defense part.
 * @param type - the damage type being checked.
 * @returns retv - a string value of "resistance", "immunity" or '' representing the defense state.
 */
function hasDefense(data: CharacterData, type: string) : string {
    let retv : string = '';
    data.defenses.forEach((defense: any) => {
        if (defense.type === type) {
            retv = defense.defense as string;
            return retv;
        }
    });
    return retv;
}

/**
 * UpdateHP is the /hp route target and is responsible for handing hit point manipulates. These include appling and 
 * managing temporary hit points, applying healing, and dealing damage. UpdateHP uses a helper function to check 
 * defenses for valid conditions which might impact the manipulations output.
 * 
 * @param key - the session data key
 * @param type - the HP manipulation type, healing, tempHP, damage, etc.
 * @param value - the amount of manipulation to apply.
 */
const UpdateHP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const key = params.get('key') || 'briv.json';
    const type = params.get('type') || 'healing'; // default to healing
    const value = params.get('value') || 0; // default to a value of zero.

    let storedData = getSessionData(key);
    
    // a list built to automate button building later on. The actual defense system can use any named thing as a damage
    // source and does not use this list for any of it's calculations.
    const types : string[] = [
        'Bludgeoning',
        'Piercing',
        'Slashing',
        'Fire',
        'Cold',
        'Acid',
        'Thunder',
        'Lightning',
        'Poison',
        'Radiant',
        'Necrotic',
        'Psychic',
        'Force',
    ];
    
    useEffect(() => {
        // check for existing data
        if (storedData) {
            console.log(`using ${storedData.name} from session ${key}.`);
        } else {
            GetData();
            storedData = getSessionData(key) as CharacterData;
        }

        var amount = value as number;
        // for general numbers generated by dice this shouldn't be necessary. but for sanity and completeness,
        // lets round down to nearest integer here before we do work with the amount.
        amount = Math.floor(+amount);
        // if amount is less than zero, set it to zero. all amounts are positive integers and the action-type is what
        // determines the way the amount is applied.
        amount = Math.max(+amount, 0);
        
        // handle manipulation types.
        switch (type) {
            // handle temporary hit points.
            case 'tempHP': {
                if (amount === 0) break;
                
                console.log(`gain ${+amount} tempHP.`);
                // only apply the highest between the current temporary hp's and the incoming amount.
                if (+storedData.tempHitPoints < +amount) {
                    storedData.tempHitPoints = +amount;
                    // save to session.
                    setSessionData(key, storedData);
                }

                console.log('temp: ' + +storedData.tempHitPoints);
                console.log('curr: ' + +storedData.currentHitPoints);
                
                break;
            }
            // apply healing
            case 'healing': {
                // if no valid amount is incoming, kick out.
                if (amount === 0) break;
                
                // apply healing with no limits to current hit points.
                console.log(`heal for ${+amount}`);
                let sum : number = +storedData.currentHitPoints + +amount;
                
                // cap the current hit point count by the creatures hit point value.
                console.log(`healed to ${+sum} of ${+storedData.modifiedHitPoints}`);
                storedData.currentHitPoints = Math.min(+sum, +storedData.modifiedHitPoints) as number;
                
                console.log('temp: ' + +storedData.tempHitPoints);
                console.log('curr: ' + +storedData.currentHitPoints);
               
                // save to session
                setSessionData(key, storedData);
                break;
            }
            // handle damages
            default: {
                console.log(`deal damage ${type} : ${+amount}`);
                
                // check for defenses first...
                let defense = hasDefense(storedData, type);
                switch (defense) {
                    // handle immunity, reduce the damage amount to zero. this can be useful if we have a system which
                    // still reports damage with the zero'd value. 
                    case 'immunity': {
                        console.log(`${storedData.name} has Immunity to ${type}!`)
                        amount = 0 as number;
                        break;
                    }
                    // handle resistance and round the resulting amount value down to nearest integer.
                    case 'resistance': {
                        console.log(`${storedData.name} has Resistence to ${type} takes half damage.`)
                        amount /= 2 as number;
                        // this should be the only other time we need to round down when working with amounts
                        amount = Math.floor(+amount);
                        break;
                    }
                    // handle vulnerability. this one does double damage, watch out!
                    case 'vulnerability': {
                        console.log(`${storedData.name} has Vulnerability to ${type} and takes double damage.`)
                        amount *= 2 as number;
                        break;
                    }
                }
                
                // since this isn't pushing into a game atm, lets just return from zero'd amounts with no handler.
                if (+amount <= 0) return;
                
                // if the total damage is greater than or equal to the creatures temps, zero the temps and reduce
                // current hit points by the remainder. This bit applies normal damage even if temps are zero.
                if (+amount >= +storedData.tempHitPoints)
                {
                    amount -= +storedData.tempHitPoints;
                    storedData.currentHitPoints -= +amount;
                    storedData.tempHitPoints = 0 as number;
                } else {
                    // otherwise, just reduce temps.
                    storedData.tempHitPoints -= +amount;
                }
                
                console.log('temp: ' + +storedData.tempHitPoints);
                console.log('curr: ' + +storedData.currentHitPoints);

                // save to session.
                setSessionData(key, storedData);
                break;
            }
        }
    }, [storedData, value, type]);
    
    // helper for the render below.
    let damage : number = 0;

    // render.
    return (
        <div>
            <h2>API Menu</h2>
            <button onClick={() => navigate('/')}>API Overview</button>
            -
            <button onClick={() => navigate('/api/get?key=briv.json')}>Get Data</button>

            <button onClick={() => navigate('/api/hp')}>Update HP</button>
            -
            <button onClick={() => navigate('/api/del?key=briv.json')}>Delete Data</button>

            <hr/>
            <div>
                <pre>
                    <h2>Update Hit Point API Call</h2>
                    <p>The <b>Update Hit Point API Call</b> takes the following components:</p>
                    
                    <ul>
                        <li>name - the name of the create in storage to manipulate.</li>
                        <li>type - the type of hit points manipulation to apply</li>
                        <li>value - the amount of hit point manipulation to attempt</li>
                    </ul>
                    <p>For Example: /api/hp?key=briv.json&type=radiant&value=6</p>
                    <p>The buttons below will make calls to the API using the format above for the values and types specified.</p>
                    <p>&nbsp;</p>
                    <p>To view the results of any given Update HP call, click the <b>GET DATA</b> button from the <b>API MENU</b>.</p>
                    <p>This will show the current character data.</p>
                    <p>Additional details are also logged to the console. The console log shows</p>
                    <ul>
                        <li>temporary hit points (temp)</li>
                        <li>current hit points (curr)</li>
                        <li>Healing</li>
                        <li>Temporary HP assignment</li>
                        <li>Defenses applied and their impact</li>
                        <li>Damage by type</li>
                    </ul>
                </pre>
            </div>
            <hr/>
            <div>
                <h2>Healing</h2>
                <a href='/api/hp?key=briv.json&type=healing&value=1'>
                    <button>Apply 1 (Healing)</button>
                </a>
                <a href='/api/hp?key=briv.json&type=healing&value=5'>
                    <button>Apply 5 (Healing)</button>
                </a>
                <a href='/api/hp?key=briv.json&type=healing&value=10'>
                    <button>Apply 10 (Healing)</button>
                </a>
                <hr/>
            </div>
            <div>
                <h2>Temporary Hit Points</h2>
                <a href='/api/hp?key=briv.json&type=tempHP&value=5'>
                    <button>Apply 5 (Temp HP)</button>
                </a>
                <a href='/api/hp?key=briv.json&type=tempHP&value=10'>
                    <button>Apply 10 (Temp HP)</button>
                </a>
                <a href='/api/hp?key=briv.json&type=tempHP&value=15'>
                    <button>Apply 15 (Temp HP)</button>
                </a>
                <hr/>
            </div>
            <div>
                <span hidden>{damage = GetRollTotal(2, 6)}</span>
                <h2>Damage by type (2d6 : {damage})</h2>
                {types.map((damageType) => (
                    <a href={'/api/hp?key=briv.json&type=' + damageType.toLowerCase() + '&value=' + damage}
                       key={damageType}>
                        <button>Apply {damage} ({damageType})</button>
                    </a>
                ))}
                <hr/>
            </div>
        </div>
    );
}

// END - SESSION HANDLING & DATA MANAGEMENT

// file name const... this can be replaced with a selector/loader/etc.
const filePath = '/briv.json';

/**
 * Route setup and intro renderer.
 */
const App: React.FC = () => {
    return (
        <Router>
            <div>
                <h1>DDB Back End Developer Challenge</h1>
                <Routes>
                    <Route path='/api/get' element={<GetData/>}/>
                    <Route path='/api/del' element={<DeleteData/>}/>
                    <Route path='/api/hp' element={<UpdateHP/>}/>
                    <Route path='/api/equip' element={<EquipItems/>}/>
                    <Route
                        path='/'
                        element={
                            <div>
                                <p>To complete this challenge, I opted to use React Routes to set up a local API
                                    that implements the requested functions.</p>
                                <p>In addition, I've added some simple button features to enable faster testing of the
                                    API's functionality.</p>
                                <h2>Additional functionality implemented:</h2>
                                <ul>
                                    
                                    <li>A basic roller which utilizes a uniform distribution model paired with a MersenneTwister(19937) algorithm. The roller is used in the Update HP test buttons to set a random value on each visit to the Update HP view. The Roller is pre-configured to roll 2d6, but can be modified to roll any number of dice and apply modifiers.</li>
                                    <li>Equip/Unequip of all items. From the Get Data view, you can equip or unequip all items. Only the constitution modifer is functional in terms of impact as this demo focuses on hit points.</li>

                                </ul>
                                <p>To get started, click the <b>START APP</b> button below.</p>
                                <h4>App Start</h4>
                                <pre><a href='/api/get?key=briv.json&reload=true'><button><code>Start App</code></button></a></pre>
                                <h4>API Routes:</h4>
                                <pre>/api/get?key=briv.json{'\t'}- Loads and displays character data from json or 
                                    session. {'\n\t\t\t'} To force a reload - add a <code>&reload=true</code> as a param.
                                    {'\n\t\t\t'} To disable use of items in hit point calculations add <code>&useItem=false</code>./
                                    {'\n\t\t\t'} Note, that item mods are currently applied on data load. this means that
                                    {'\n\t\t\t'} if you access /get with <code>&useItem=false</code> then the briv's current hit points
                                    {'\n\t\t\t'} will show as 30 (base 25 + 5; +1 per level due ot the Ioun Stone of Fortitude). Any
                                    {'\n\t\t\t'} /hp (Update HP) actions after that will use the current state.
                                </pre>
                                <pre>/api/del?key=briv.json{'\t'}- Delete session data</pre>
                                <pre>/api/hp{'\t\t\t'}- Manipulate hit point related things.
                                    {'\n\t\t\t'}  ex. /api/hp?key=briv.json&type=healing&value=10
                                    {'\n\t\t\t'}  ex. /api/hp?key=briv.json&type=tempHP&value=8
                                    {'\n\t\t\t'}  ex. /api/hp?key=briv.json&type=fire&value=12</pre>
                                <pre>/api/equip{'\t\t'}- Equip or Unequip all gear. This can be extended to specific gear as needed.
                                    {'\n\t\t\t'}  ex. /api/equip?key=briv.json&equip=true -- equip all gear
                                    {'\n\t\t\t'}  ex. /api/equip?key=briv.json&equip=false -- unequip all gear</pre>
                            </div>
                        }
                        />
                </Routes>
            </div>
        </Router>
    );
};
export default App
