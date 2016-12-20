import React, {Component} from 'react';
import {Row,Col} from 'react-bootstrap';
import firebase from 'firebase';
import Autocomplete from 'react-google-autocomplete';
import Select from 'react-select';
import $ from 'jquery';
import update from 'immutability-helper';
import {FBAppStorage} from '../modules/firebase';
import Dropzone from 'react-dropzone';
import {browserHistory} from 'react-router';

// import components
import Video from './Video';
import Soundcloud from './Soundcloud';
import Instrument from './Instrument';


class EditProfile extends Component {
    constructor(props){
        super(props);
        this.state = {
            user: {
                name: "",
                surname: "",
                age: "",
                gender: "",
                availability: "",
                location: "",
                about: "",
                image: "",
                instruments: [],
                music_listen: [],
                music_play: [],
                soundcloud: [],
                youtube: [],
            },
            instruments: [],
            music_listen: [],
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleInstrumentChange= this.handleInstrumentChange.bind(this);
        this.getOptions = this.getOptions.bind(this);
        this.musicPlayChange = this.musicPlayChange.bind(this);
        this.musicListenChange = this.musicListenChange.bind(this);
        this.saveData = this.saveData.bind(this);
        this.saveInstrument= this.saveInstrument.bind(this);
        this.addYoutubeVideo = this.addYoutubeVideo.bind(this);
        this.addSoundcloudTrack = this.addSoundcloudTrack.bind(this);
        this.removeInstrument = this.removeInstrument.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.removeImage = this.removeImage.bind(this);


        var foo = [1, 'string', '2'];
        function d(a) {
            return {r: a[1] + a[a.length - 1]};
        }
        console.log(d(foo));

    }

    componentWillMount() {
        // Load user data
        let profileId = this.props.params.userId;
        var USER_DB = firebase.database().ref('users/' + profileId);

        return USER_DB.once('value').then(function (snapshot) {
            let user = snapshot.val();
            // let newUserState = update(this.state.user, {$merge: user});
            this.setState({user: update(this.state.user, {$merge: user})});
        }.bind(this));
    }

    handleChange(e){
        switch (e.target.name) {
            case 'experience':
                this.setState({instruments: {...this.state.instruments, experience: e.target.value}});
                break;
            case 'youtube':
                this.setState({youtube: {...this.state.youtube, video: e.target.value}});
                break;
            case 'soundcloud':
                let source = e.target.value.substring(e.target.value.search("src")+5, e.target.value.lastIndexOf("false")+5);
                this.setState({soundcloud: {...this.state.soundcloud, track: source}});
                break;
            default:
                this.setState({user : { ...this.state.user, [e.target.name]: e.target.value}});
        }
    }

    getOptions(){
        var genres = this.props.route.genres;
        var filter_options = [];
        for (var genre in genres) {
            console.log(genres[genre]);
            filter_options.push({'value': genres[genre], 'label': genres[genre]});
        }
        return filter_options;
    }

    musicPlayChange(val){
        let musicPlayArray = update(this.state.user.music_play, {$push: [val.value]});
        this.setState({user: {...this.state.user, music_play: musicPlayArray}});
    }

    musicListenChange(val){
        let musicListenArray = update(this.state.user.music_listen, {$push: [val.value]})
        this.setState({user: {...this.state.user, music_listen: musicListenArray}});
    }

    saveData(){
        let user = this.state.user;
        let profileId = this.props.params.userId;

        console.log('soundcloud: ',user.soundcloud);

        firebase.database().ref('users/' + profileId).update({
            name: user.name,
            surname: user.surname,
            availability: user.availability,
            image : user.image,
            id: profileId,
            age: user.age,
            gender: user.gender,
            location: user.location,
            about: user.about,
            music_play: user.music_play,
            music_listen: user.music_listen,
            instruments: user.instruments,
            soundcloud: user.soundcloud,
            youtube: user.youtube,
        }).then(function () {
            browserHistory.push('/profile/'+profileId);
        });
    }

    handleInstrumentChange(val){
        this.setState({instruments: {...this.state.instruments, name: val.value }});
    }

    handleMusicListenChange(val){
        this.setState({music_listen: {...this.state.music_listen, name: val.value }});
    }

    saveInstrument(){
        let instrumentsArray = update(this.state.user.instruments, {$push: [this.state.instruments]});
        this.setState({user: {...this.state.user, instruments: instrumentsArray }});
    }

    addYoutubeVideo(){
        let youtubeArray = update(this.state.user.youtube, {$push: [this.state.youtube]});
        this.setState({user: {...this.state.user, youtube: youtubeArray }});
    }

    addSoundcloudTrack(){
        let soundcloudArray = update(this.state.user.soundcloud, {$push: [this.state.soundcloud]});
        this.setState({user: {...this.state.user, soundcloud: soundcloudArray }});
    }

    removeInstrument(val) {
        console.log('clicked on remove! ', val);
        this.setState({
            user: update(this.state.user, {instruments: {$splice: [[val,1]]}})
        })
    }

    onDrop (acceptedFiles, rejectedFiles) {
        console.log('Accepted files: ', acceptedFiles);
        console.log('Rejected files: ', rejectedFiles);

        let storageRef = FBAppStorage.ref();
        let profilePicRef = storageRef.child('profile-pictures/'+firebase.auth().currentUser.uid);

        let uploadTask = profilePicRef.put(acceptedFiles[0]);

        let self = this;

        // Listen for state changes, errors, and completion of the upload.
        uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
            function(snapshot) {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                        console.log('Upload is paused');
                        break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                        console.log('Upload is running');
                        break;
                }
            }, function(error) {
                switch (error.code) {
                    case 'storage/unauthorized':
                        // User doesn't have permission to access the object
                        break;

                    case 'storage/canceled':
                        // User canceled the upload
                        break;

                    case 'storage/unknown':
                        // Unknown error occurred, inspect error.serverResponse
                        break;
                }
            }, function() {
                // Upload completed successfully, now we can get the download URL
                let downloadURL = uploadTask.snapshot.downloadURL;
                self.setState({user: {...self.state.user, image: downloadURL}});
            });
    }

    removeImage(){
        console.log('remove image');
        this.setState({user: {...this.state.user, image: ""}});
    }

    removeWhatILikeToPlay(index){
        this.setState({user: update(this.state.user, {music_play: {$splice: [[index,1]]}})});
    }

    removeMusicInfluencer(index){
        this.setState({user: update(this.state.user, {music_listen: {$splice: [[index,1]]}})});
    }

    removeYoutubeVideo(index){
        this.setState({user: update(this.state.user, {youtube: {$splice: [[index,1]]}})});
    }

    removeSoundcloudSong(index){
        this.setState({user: update(this.state.user, {soundcloud: {$splice: [[index,1]]}})});
    }

    render() {
        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <h2>Edit your profile</h2>
                    </Col>
                </Row>
                <Row className="edit">
                    <Col xs={3}>
                        {this.state.user.image ? <div><img src={this.state.user.image} alt={this.state.user.name + this.state.user.surname}/><button value='Change profile pic' onClick={this.removeImage}>Change profile pic</button></div> :
                            <Dropzone accept={'image/*'} multiple={false} onDrop={this.onDrop}>
                                <div>Add a profile picture!</div>
                            </Dropzone>}
                    </Col>
                    <Col xs={9}>
                        <div className="form-group">
                            <Row>
                                <Col xs={12}>
                                    <h2>My info</h2>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} sm={6}>
                                    <label htmlFor="name">
                                        Name <input type="text" name="name" value={this.state.user.name} onChange={this.handleChange}/>
                                    </label>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <label htmlFor="surname">
                                        Surname <input type="text" name="surname" value={this.state.user.surname} onChange={this.handleChange}/>
                                    </label>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} sm={6}>
                                    <label htmlFor="age">
                                        Age <input type="text" name="age" placeholder="e.g. 23" value={this.state.user.age} onChange={this.handleChange}/>
                                    </label>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <label id="radio-gender">
                                        Gender
                                        <div className="radio">
                                            <label>
                                                <input type="radio" name="gender" value="male" checked={this.state.user.gender === 'male'} onChange={this.handleChange}/>
                                                Male
                                            </label>
                                        </div>
                                        <div className="radio">
                                            <label>
                                                <input type="radio" name="gender" value="female" checked={this.state.user.gender === 'female'} onChange={this.handleChange} />
                                                Female
                                            </label>
                                        </div>
                                    </label>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} sm={6}>
                                    <label htmlFor="location">
                                        Location
                                        <Autocomplete
                                            name="location"
                                            onPlaceSelected={(place) => {
                                                console.log('setting ' + place.name + ' as location in state');
                                                this.setState({user: { ...this.state.user, location: place.name}});
                                            }}
                                            types={['(regions)']} value={this.state.user.location} onChange={this.handleChange}
                                            className="autocompleteLocation" />
                                    </label>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <label htmlFor="availability">
                                        Availability <input type="text" name="availability" value={this.state.user.availability} onChange={this.handleChange}/>
                                    </label>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <label htmlFor="about">
                                        About me <textarea name="about" id="" cols="30" rows="10" placeholder="Present yourself to other musicians!" value={this.state.user.about} onChange={this.handleChange}></textarea>
                                    </label>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <h2>My instruments</h2>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} id="instrument-form">
                                    <Select
                                        name="instruments"
                                        value={this.state.instruments.name}
                                        options={this.props.route.instruments}
                                        onChange={this.handleInstrumentChange}
                                    />
                                    <input type="text" name="experience" placeholder="Years of experience.." value={this.state.user.experience} onChange={this.handleChange}/>
                                    <button id="add-instrument" onClick={this.saveInstrument}>Add instrument</button>
                                </Col>
                            </Row>
                            <Row>
                                <div className="container-tags">
                                    {this.state.user.instruments.map((instrument, index) => {
                                        return <Instrument key={instrument.name} index={index} removeInstrument={this.removeInstrument} name={instrument.name} experience={instrument.experience}/>;
                                    })}
                                </div>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <h2>My music</h2>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6}>
                                    <label htmlFor="music_play">
                                        What I like to play
                                        <Select.Async
                                            name="music_play"
                                            loadOptions={this.getOptions}
                                            onChange={this.musicPlayChange}
                                        />
                                    </label>
                                    <div id="music_like_container" className="container-tags">
                                        {this.state.user.music_play.map((name,index) => {
                                            return <a key={index} href="#0" value={name} className="tag"> {name} <span onClick={this.removeWhatILikeToPlay.bind(this, index)}>x</span></a>;
                                            })
                                        }
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <label htmlFor="music_listen">
                                        Music influencers
                                        <Select
                                            name="music_listen"
                                            value={this.state.music_listen.name}
                                            options={this.props.route.genres}
                                            onChange={this.handleMusicListenChange}
                                        />
                                    </label>
                                    <div className="container-tags">
                                        {this.state.user.music_listen.map((name,index) => {
                                            return <a key={index} href="#0" className="tag"> {name} <span onClick={this.removeMusicInfluencer.bind(this, index)}>x</span></a>;
                                            })
                                        }
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <h2>Youtube</h2>
                                    <p>Add here the Youtube links to videos that show how awesome you are!</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <input className="inline" type="text" name="youtube" onChange={this.handleChange}/>
                                    <button onClick={this.addYoutubeVideo}>Add video</button>

                                </Col>
                            </Row>
                            <Row>
                                <div className="container-tags">
                                    {this.state.user.youtube.map((source,index) => {
                                        return <Col xs={12} sm={6}> <Video key={index} source={source.video} /> <button onClick={this.removeYoutubeVideo.bind(this, index)}>X</button> </Col>;
                                        })
                                    }
                                </div>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <h2>Soundcloud</h2>
                                    <p>Add here the Soundcloud links!</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <input className="inline" type="text" name="soundcloud" onChange={this.handleChange}/>
                                    <button onClick={this.addSoundcloudTrack}>Add track</button>
                                </Col>
                            </Row>
                            <Row>
                                <div className="container-tags">
                                    {this.state.user.soundcloud.map((source,index) => {
                                        return <Col xs={12} sm={6}> <Soundcloud source={source.track} /> <button onClick={this.removeSoundcloudSong.bind(this, index)}>X</button> </Col>;
                                    })
                                    }
                                </div>
                            </Row>
                            <div className="text-center">
                                <button onClick={this.saveData}>Save</button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default EditProfile;
