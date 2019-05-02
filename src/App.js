import React from 'react';
import logo from './logo.svg';
import './App.css';



class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      gameLocation: 'Enter Game Location',
      startChipCount: 100,
      initialChipCount: 0,
      chipValue: 0.5,
      visibleSection: 'game-start',
      newPlayerName: '',
      deletePlayer:'',
      players: [],
      playersList: [],
      selectedPlayer: '',
      playerFinalChips: -1,
      totalFinalChipsGiven: 0,
      totalChipsTaken: 0
    };

  }

  componentDidMount = () => {
    localStorage.clear();
  }

  editBuyin = (option) => {
    let sPlayerSelected = this.state.selectedPlayer;
    let sPlayers = this.state.players;
    let sTotalInitialChipsTaken = parseInt(this.state.totalChipsTaken);

    sPlayers.forEach(item => {
      if(sPlayerSelected == item.player_name) {
        if(option == 'add') {
          item.later_buyins = item.later_buyins + 1;
          sTotalInitialChipsTaken = sTotalInitialChipsTaken +  parseInt(this.state.startChipCount);
        }
        else {
          item.later_buyins = item.later_buyins - 1;
          sTotalInitialChipsTaken = sTotalInitialChipsTaken -  parseInt(this.state.startChipCount);
        }
        
      }
    });

    this.setState({players: sPlayers, totalChipsTaken: sTotalInitialChipsTaken});
    localStorage.setItem('players', JSON.stringify(sPlayers));

  }


  startNewGame = () => {
    
    let sGameDetails = {
      gameLocation: this.state.gameLocation,
      date: 'Today',
      startChipCount: this.state.startChipCount,
      chipValue: this.state.chipValue
    };

    let sInitialchipCount = parseInt(this.state.startChipCount);
    this.setState({visibleSection: 'add-players', initialChipCount: sInitialchipCount});
    localStorage.setItem('gameDetails', JSON.stringify(sGameDetails));
    
  }

  addNewPlayer = () => {
    let sNewPlayerName = this.state.newPlayerName;
    let sPlayers = this.state.players;
    let sPlayersList = this.state.playersList;    
    let sTotalInitialChipsTaken =  parseInt(this.state.totalChipsTaken);
    let sPlayerInfo = {
      player_name: sNewPlayerName,
      initial_chips:  parseInt(this.state.initialChipCount),
      later_buyins: 0,
      final_count: 0,
      chipsWon: null
    }

    sTotalInitialChipsTaken = sTotalInitialChipsTaken +  parseInt(this.state.initialChipCount);
    if(sPlayersList.indexOf(sNewPlayerName) > -1) {
      alert('Player already registered');
    }
    else {
      sPlayersList.push(sNewPlayerName);
      sPlayers.push(sPlayerInfo);      
      
      this.setState({players: sPlayers, playersList: sPlayersList, totalChipsTaken: sTotalInitialChipsTaken});
      localStorage.setItem('players', JSON.stringify(sPlayers));
    }    
  }

  deletePlayer = () => {
    let sDeletePlayerName = this.state.deletePlayer;
    let sPlayers = this.state.players;
    let sPlayersList = this.state.playersList;

    for(var i=0; i<sPlayers.length; i++) {
      if(sDeletePlayerName == sPlayers[i].player_name) {
        sPlayers.splice(i,1);
      }
    }
    
    const sPlayersListFiltered = sPlayersList.filter(item => item !== sDeletePlayerName);

    this.setState({players: sPlayers, playersList: sPlayersListFiltered});

    localStorage.setItem('players', JSON.stringify(sPlayers));

  }

  calculatePayouts = () => {

    let profitClub = [];
    let loosersClub = [];
    let stotalFinalChipsGiven = parseInt(this.state.totalFinalChipsGiven);
    let sPlayers = this.state.players;

    sPlayers.forEach(player => {
      let sProfitPlayer= {
        player_name: null,
        chips_won: 0,
        chips_adjusted:0,
        chips_due:0,
        isSettled: false
      };
      let sLostPlayer= {
        player_name: null,
        chips_lost: 0,
        chips_adjusted:0,
        chips_due:0,
        isSettled: false
      };
      stotalFinalChipsGiven =  stotalFinalChipsGiven + parseInt(player.final_count);
      const sPlayerChipsBorrowed = parseInt(player.initial_chips) + (parseInt(this.state.startChipCount) * parseInt(player.later_buyins));
      const sPlayerChipsWon = parseInt(player.final_count);

      player.chipsWon =  sPlayerChipsWon - sPlayerChipsBorrowed;

      if(player.chipsWon >= 0) {
        sProfitPlayer.player_name = player.player_name;
        sProfitPlayer.chips_won = parseInt(player.chipsWon);
        profitClub.push(sProfitPlayer);
      }
      else {
        sLostPlayer.player_name = player.player_name;
        sLostPlayer.chips_lost = (parseInt(player.chipsWon) * -1);
        loosersClub.push(sLostPlayer);
      }


    });
  
    localStorage.setItem('players', JSON.stringify(sPlayers));

    if(parseInt(this.state.totalChipsTaken) != parseInt(stotalFinalChipsGiven)) {
      
      if(parseInt(this.state.totalChipsTaken) > parseInt(stotalFinalChipsGiven)){
        const sTotalChipsMissing = parseInt(this.state.totalChipsTaken) - parseInt(stotalFinalChipsGiven);
        alert(sTotalChipsMissing + ' chips missing. please adjuist.');
      }
      else {
        const sExtraChips = parseInt(stotalFinalChipsGiven) - parseInt(this.state.totalChipsTaken);
        alert(sExtraChips + ' Chips extra. please adjust.');
      }
      


    }
    else {
      alert("Chips count matched. Adjusting payments.");

      // Lets sort both profitClub and loosersClub in high to low order

      profitClub.sort(this.profitCompare);
      loosersClub.sort(this.lossCompare);

      localStorage.setItem('profitClub', JSON.stringify(profitClub));
      localStorage.setItem('loosersClub', JSON.stringify(loosersClub));

      profitClub.forEach(playerA => {

       // let sTempLoosersClub = this.adjustPayout(player, sTempLoosersClub);

       loosersClub.forEach(playerB => {

        if(parseInt(playerA.chips_won) > parseInt(playerB.chips_lost)) {

          if((playerB.isSettled !== true) && (playerA.isSettled !== true)) {
            playerA.chips_adjusted = playerB.chips_lost;
          playerA.chips_due =  playerA.chips_won - playerB.chips_lost;

          playerB.chips_adjusted = playerB.chips_lost;
          playerB.chips_due = 0;

          if((playerB.chips_lost * this.state.chipValue) > 0) {
            console.log(playerB.player_name + ' pays ' + (playerB.chips_lost * this.state.chipValue) + ' to ' + playerA.player_name);
          }          

          playerA.chips_won = playerA.chips_won - playerB.chips_lost;
          playerB.chips_lost = 0;
          playerB.isSettled = true;
          }          
        }
        else if(parseInt(playerA.chips_won) === parseInt(playerB.chips_lost)){

          if((playerB.isSettled !== true) && (playerA.isSettled !== true)) {
            playerA.chips_adjusted = playerB.chips_lost;
            playerA.chips_due = 0;
  
            playerB.chips_adjusted = playerB.chips_lost;
            playerB.chips_due = 0;
  
            if((playerB.chips_lost * this.state.chipValue) > 0){
              console.log(playerB.player_name + ' pays ' + (playerB.chips_lost * this.state.chipValue) + ' to ' + playerA.player_name); 
            }
            
            playerA.chips_won = 0;
            playerB.chips_lost = 0;   
            playerB.isSettled = true;
            playerA.isSettled = true;
          }                
        }
        else{
          if((playerB.isSettled !== true) && (playerA.isSettled !== true)) {
            playerA.chips_adjusted = playerA.chips_won;
            playerA.chips_due = 0;

            playerB.chips_adjusted = playerA.chips_won;
            playerB.chips_due = playerB.chips_lost - playerA.chips_won;

            if((playerA.chips_won * this.state.chipValue) > 0) {
              console.log(playerB.player_name + ' pays ' + (playerA.chips_won * this.state.chipValue) + ' to ' + playerA.player_name);
            }
            
            playerB.chips_lost = playerB.chips_lost - playerA.chips_won;    
            playerA.chips_won = 0;      
            playerA.isSettled = true;
          }          
        }
       });

        
      })

    }

  }

  adjustPayout = (profitPlayer, loosersArray) => {


  }


  profitCompare =(a, b) => {
    // Use toUpperCase() to ignore character casing
    const playerA = parseInt(a.chips_won);
    const playerB = parseInt(b.chips_won);
  
    let comparison = 0;
    if (playerA < playerB) {
      comparison = 1;
    } else {
      comparison = -1;
    }
    return comparison;
  }

  lossCompare =(a, b) => {
    // Use toUpperCase() to ignore character casing
    const playerA = parseInt(a.chips_lost);
    const playerB = parseInt(b.chips_lost);
  
    let comparison = 0;
    if (playerA < playerB) {
      comparison = 1;
    } else {
      comparison = -1;
    }
    return comparison;
  }


  showAddPlayerSection = () => {
    this.setState({visibleSection: 'add-players'});
  }

  showAddBuyinSection = () => {
    this.setState({visibleSection: 'add-buyin'});
  }

  showFinalPayoutSection = () => {
    this.setState({visibleSection: 'final-payout'});
  }

  gameLocationChanged = (event) => {
    this.setState({gameLocation: event.target.value});
  }

  startChipCountChanged = (event) => {
    this.setState({startChipCount: event.target.value});
  }

  chipValueChanged = (event) => {
    this.setState({chipValue: event.target.value});
  }
  
  playerNameChanged = (event) => {
    this.setState({newPlayerName: event.target.value});
  }

  selectedPlayerChanged = (event) => {
    this.setState({selectedPlayer: event.target.value});
  }

  deletePlayerChanged = (event) => {
    this.setState({deletePlayer: event.target.value});
  }

  playerFinalChipsChanged = (player , event) => {
    let sPlayers = this.state.players;
    //let stotalFinalChipsGiven = parseInt(this.state.totalFinalChipsGiven);
    this.setState({playerFinalChips: event.target.value}, () => {
      sPlayers.forEach(item => {
        if(player == item.player_name) {
          item.final_count = parseInt(this.state.playerFinalChips);          
        }
      });
      //stotalFinalChipsGiven = stotalFinalChipsGiven + parseInt(this.state.playerFinalChips);
      this.setState({players: sPlayers});
      localStorage.setItem('players', JSON.stringify(sPlayers));
    });    

   
  }

  
  initialChipCountChanged = (event) => {
    this.setState({initialChipCount: event.target.value});
  }

  render() {

    const Player = this.state.playersList.map(function(player) {
      return <li>{player}</li>;
    });

    const deletePlayer = this.state.playersList.map(function(player) {
      return <option>{player}</option>;
    });

    const TotalPlayerBuyins = this.state.players.map(function(player) {
      return <li> {player.player_name} : {player.later_buyins} </li>;
    });

    const finalPlayerInfo = this.state.players.map(function(player) {
      return <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text">Enter {player.player_name} chips</span>
              </div>
              <input type="text" className="form-control"  onChange={(event)=> this.playerFinalChipsChanged(player.player_name, event)} />
            </div>;
    }, this);

    return (
      <div className="App container-fluid">

        <div> 
          <span onClick={this.showAddPlayerSection}>Add Player  </span>
          <span onClick={this.showAddBuyinSection}>Add buyin  </span>
          <span onClick={this.showFinalPayoutSection}>Payout  </span>
        </div>
        
        <section className={'col-xs-12 col-sm-6 offset-sm-3 game-section game-start-section ' + (this.state.visibleSection == 'game-start' ? 'd-inline-block' : 'd-none')}>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">Enter Game location</span>
            </div>
            <input type="text" className="form-control" value={this.state.gameLocation} onChange={this.gameLocationChanged} />
          </div>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">Start Chip count</span>
            </div>
            <input type="text" className="form-control" value={this.state.startChipCount} onChange={this.startChipCountChanged} />
          </div>

          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">Game Chip value</span>
            </div>
            <input type="text" className="form-control" value={this.state.chipValue} onChange={this.chipValueChanged} />
          </div>

          <div>
            <span>Game Date: </span> <span>Today</span>
          </div>



          <button className="btn btn-primary" onClick={this.startNewGame}>Start Game</button>
        </section>
        <section className={'col-xs-12 col-sm-6 offset-sm-3 game-section game-add-player-section ' + (this.state.visibleSection == 'add-players' ? 'd-inline-block' : 'd-none')}>

            <div className="col-xs-12 col-sm-6">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">Enter Player name</span>
                </div>
                <input type="text" className="form-control" value={this.state.newPlayerName} onChange={this.playerNameChanged} />
              </div>

              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">Initial Chips</span>
                </div>
                <input type="text" className="form-control" value={this.state.initialChipCount} onChange={this.initialChipCountChanged} />
              </div>

              <button className="btn btn-primary" onClick={this.addNewPlayer}>Add New player</button>
            </div>

            
            <hr/>

            <h3>Delete players</h3>
            <select className="form-control" value={this.state.deletePlayer} onChange={this.deletePlayerChanged}>
             {deletePlayer}
            </select>
            <button className="btn btn-primary" onClick={this.deletePlayer}>Delete Player</button>


            <div className='col-xs-12 col-sm-6'>
              <h3>Players list</h3>
              <ul>{Player}</ul>              
            </div>


        </section>

        <section className={'col-xs-12 col-sm-6 offset-sm-3 game-section game-add-buyin-section ' + (this.state.visibleSection == 'add-buyin' ? 'd-inline-block' : 'd-none')}>
          <select className="form-control" value={this.state.selectedPlayer} onChange={this.selectedPlayerChanged}>
             {deletePlayer}
          </select>

          <button className="btn btn-primary" onClick={() => this.editBuyin('add')}>Add Buyin</button>
          <button className="btn btn-primary" onClick={() => this.editBuyin('remove')}>Remove Buyin</button>


          <hr />
          <h3>Buyins count of each player</h3>  
          <ul>{TotalPlayerBuyins}</ul>
        </section>

        <section className={'col-xs-12 col-sm-6 offset-sm-3 game-section game-final-payout-section ' + (this.state.visibleSection == 'final-payout' ? 'd-inline-block' : 'd-none')}>
          {finalPlayerInfo}

          <button className="btn btn-primary" onClick={this.calculatePayouts}>Calculate</button>
        </section>
      </div>
    );
  }


}


export default App;
