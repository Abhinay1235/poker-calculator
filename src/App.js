import React from 'react';
import './App.css';

import Alert from 'react-s-alert';
import 'react-s-alert/dist/s-alert-default.css';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      gameLocation: '',
      startChipCount: 0,
      chipValue: 0,
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
        if(option == 'remove') {
          if(item.later_buyins > 0){
            item.later_buyins = item.later_buyins - 1;
          }          
          sTotalInitialChipsTaken = sTotalInitialChipsTaken -  parseInt(this.state.startChipCount);
        }
        else {
          item.later_buyins = item.later_buyins + 1;
          sTotalInitialChipsTaken = sTotalInitialChipsTaken +  parseInt(this.state.startChipCount);
        }
        
      }
    });

    this.setState({players: sPlayers, totalChipsTaken: sTotalInitialChipsTaken});
    localStorage.setItem('players', JSON.stringify(sPlayers));

  }


  startNewGame = () => {
    
    const sGameLocation = this.state.gameLocation;
    const sStartChipCount = parseInt(this.state.startChipCount);
    const sChipValue = parseFloat(this.state.chipValue);

    if(sGameLocation.length <= 0) {
      alert("Please provide Game location");
    }
    else if(sStartChipCount <= 0){
      alert("Please provide start chip count greater than Zero.");
    }
    else if(sChipValue <=0 ){
      alert("Please provide Game Chip Value greater than Zero.");
    }
    else {
      let sGameDetails = {
        gameLocation: sGameLocation,
        date: this.state.date.toString(),
        startChipCount: sStartChipCount,
        chipValue: sChipValue
      };
  
      this.setState({visibleSection: 'game-progress'});
      localStorage.setItem('gameDetails', JSON.stringify(sGameDetails));
    }    
    
  }

  addNewPlayer = () => {
    let sNewPlayerName = this.state.newPlayerName;
    let sPlayers = this.state.players;
    let sPlayersList = this.state.playersList;    
    let sTotalInitialChipsTaken =  parseInt(this.state.totalChipsTaken);
    let sPlayerInfo = {
      player_name: sNewPlayerName,
      initial_chips:  parseInt(this.state.startChipCount),
      later_buyins: 0,
      final_count: 0,
      chipsWon: null
    }

    sTotalInitialChipsTaken = sTotalInitialChipsTaken +  parseInt(this.state.startChipCount);
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
    let sTotalInitialChipsTaken =  parseInt(this.state.totalChipsTaken);

    for(var i=0; i<sPlayers.length; i++) {
      if(sDeletePlayerName == sPlayers[i].player_name) {
        sTotalInitialChipsTaken = sTotalInitialChipsTaken - (sPlayers[i].initial_chips + (sPlayers[i].later_buyins * parseInt(this.state.startChipCount)));
        sPlayers.splice(i,1);
      }
    }
    
    const sPlayersListFiltered = sPlayersList.filter(item => item !== sDeletePlayerName);

    this.setState({players: sPlayers, playersList: sPlayersListFiltered, totalChipsTaken: sTotalInitialChipsTaken});

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
            Alert.success(playerB.player_name + ' pays ' + (playerB.chips_lost * this.state.chipValue) + ' to ' + playerA.player_name);
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
              Alert.success(playerB.player_name + ' pays ' + (playerB.chips_lost * this.state.chipValue) + ' to ' + playerA.player_name);
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
              Alert.success(playerB.player_name + ' pays ' + (playerA.chips_won * this.state.chipValue) + ' to ' + playerA.player_name);
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
      <div className="App">

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top ">
        <a className="navbar-brand" href="#">Poker Payouts Calculator</a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        {/*<div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item active">
              <a className="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Features</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Pricing</a>
            </li>
            <li className="nav-item">
              <a className="nav-link disabled" href="#" tabindex="-1" aria-disabled="true">Disabled</a>
            </li>
          </ul>
        </div>*/}
      </nav>
      <div className="container-fluid">
        <Alert stack={true}  effect='stackslide' position='top' timeout='none'/>
        {/* Home screen for starting game */}
        
        <div className={'row game-section game-start-section ' + (this.state.visibleSection == 'game-start' ? '' : 'd-none')}>
          <div className="col-12">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text" >Enter Game location</span>
              </div>
              <input type="text" className="form-control" value={this.state.gameLocation} onChange={this.gameLocationChanged} required/>
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
              <span>Game Date: </span> <span>{this.state.date.toString()}</span>
            </div>

            <button type="button" className="btn btn-primary" onClick={this.startNewGame}> Start Game</button>
          </div>
        </div>

        {/* End of Home section */}

        {/* Game Started section */}
        <div className={'row game-section game-progress-section ' + (this.state.visibleSection == 'game-progress' ? '' : 'd-none')}>
          
          <div className="col-12 ">

            <ul className="nav nav-tabs" id="pills-tab" role="tablist">
              <li className="nav-item">
                <a className="nav-link active" id="pills-manage-players-tab" data-toggle="pill" href="#pills-manage-players" role="tab" aria-controls="pills-manage-players" aria-selected="true">Players</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="pills-manage-buyins-tab" data-toggle="pill" href="#pills-manage-buyins" role="tab" aria-controls="pills-manage-buyins" aria-selected="false">Buyins</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="pills-payouts-tab" data-toggle="pill" href="#pills-payouts" role="tab" aria-controls="pills-payouts" aria-selected="false">Payouts</a>
              </li>
            </ul>

            <div className="tab-content" id="pills-tabContent">
              <div className="tab-pane fade show active" id="pills-manage-players" role="tabpanel" aria-labelledby="pills-manage-players-tab">
                                  
                <div className="row">                  
                  <div className="col-12">

                    <div className="input-group">
                      <input type="text" className="form-control" value={this.state.newPlayerName} onChange={this.playerNameChanged} placeholder="Enter player name" aria-label="Player name" aria-describedby="button-addon2" />
                      <div className="input-group-append">
                        <button className="btn btn-primary" type="button" id="button-addon2" onClick={this.addNewPlayer}>Add Player</button>
                      </div>
                    </div>

                    <div className="input-group">
                      <select className="custom-select" aria-label="Delete player" value={this.state.deletePlayer} onChange={this.deletePlayerChanged}>
                        <option selected>Choose Player...</option>
                        {deletePlayer}
                      </select>
                      <div className="input-group-append">
                        <button className="btn btn-danger" type="button" onClick={this.deletePlayer} >Delete Player</button>
                      </div>
                    </div>

                  </div>

                  <div className='col-12'>
                      <h3>Players list</h3>
                      <ol>{Player}</ol>              
                  </div>
                </div>
              </div>


              <div className="tab-pane fade" id="pills-manage-buyins" role="tabpanel" aria-labelledby="pills-manage-buyins-tab">
                
                <div className="col-12">
                  <div className="input-group">
                    <select className="custom-select" aria-label="Manage Buyin" value={this.state.selectedPlayer} onChange={this.selectedPlayerChanged}>
                      <option selected>Choose player...</option>
                      {deletePlayer}
                    </select>
                    <div className="input-group-append" id="button-addon3">
                      <button className="btn btn-primary" type="button" onClick={() => this.editBuyin('add')} ></button>
                      <button className="btn btn-danger" type="button" onClick={() => this.editBuyin('remove')}></button>
                    </div>                  
                  </div>
                </div>

                <div className='col-12'>
                  <h3>Buyins count of each player</h3>
                  <ul>{TotalPlayerBuyins}</ul>              
                </div>
              </div>

              <div className="tab-pane fade" id="pills-payouts" role="tabpanel" aria-labelledby="pills-payouts-tab">
                {finalPlayerInfo}

                <button className="btn btn-primary" onClick={this.calculatePayouts}>Calculate</button>
              </div>
            </div>
          </div>


        </div>

      </div>
      </div>  
    );
  }


}


export default App;
