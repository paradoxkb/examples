/**
 * Created by watcher on 9/25/17.
 */
import { Meteor } from 'meteor/meteor'
import React from 'react'
import CustomUploaderFiles from '../../components/CustomUploaderFiles/CustomUploaderFiles'
import { MainPictures, toggleLoader, setResponseText } from '/imports/utilities'
import { MAX_MAINPAGE_PICTURES } from '/imports/constants'

class MainPicturesManager extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			images: []
		}

		this.updateMainPictures = this.updateMainPictures.bind(this)
		this.changeImagesHandler = this.changeImagesHandler.bind(this)
	}

	componentWillMount() {
		Meteor.subscribe('mainPictures', this.updateMainPictures)
	}

	updateMainPictures() {
		const images = MainPictures.find().fetch()
		toggleLoader(true)

		this.setState({images}, toggleLoader)
	}

	changeImagesHandler(images, removedID = '') {
		const currentImages = this.state.images
		let newImage,
			imageIdToRemove = {}
		toggleLoader(true)

		if (images.length >= currentImages.length) {
			newImage = images[images.length - 1]
			MainPictures.insert(newImage, responseHandler.bind(this))
		} else if (removedID.length) {
			imageIdToRemove = currentImages.filter(item => (item.imageID === removedID))[0]._id
			MainPictures.remove(imageIdToRemove, responseHandler.bind(this))
		}

		function responseHandler(err) {
			if (err) {
				setResponseText(err.reason, 0)
			} else {
				toggleLoader()
				this.updateMainPictures()
			}
		}
	}

	render() {
		const { images } = this.state

		return (
			<div className='row main-pictures-area'>
				<div className='cols-xs-12'>
					<CustomUploaderFiles
						images={images}
						changeHandler={this.changeImagesHandler}
						max={MAX_MAINPAGE_PICTURES}
					/>
				</div>
			</div>
		)
	}
}

export default MainPicturesManager
