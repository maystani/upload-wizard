/*
 * This file is part of the MediaWiki extension UploadWizard.
 *
 * UploadWizard is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * UploadWizard is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with UploadWizard.  If not, see <http://www.gnu.org/licenses/>.
 */

( function ( uw ) {
	/**
	 * Represents the UI for the wizard's Thanks step.
	 *
	 * @class uw.ui.Thanks
	 * @extends uw.ui.Step
	 * @constructor
	 * @param {Object} config
	 */
	uw.ui.Thanks = function UWUIThanks( config ) {
		var $header,
			beginButtonTarget,
			thanks = this;

		this.config = config;

		uw.ui.Step.call(
			this,
			'thanks'
		);

		this.$div.prepend(
			$( '<div>' ).attr( 'id', 'mwe-upwiz-thanks' )
		);

		if ( this.isObjectReferenceGiven() ) {
			this.getDelayNotice().prependTo( this.$div );
		}

		$( '<p>' )
			.addClass( 'mwe-upwiz-thanks-explain' )
			.msg( 'mwe-upwiz-thanks-explain' )
			.prependTo( this.$div );

		$header = $( '<h3>' )
			.addClass( 'mwe-upwiz-thanks-header' )
			.prependTo( this.$div );

		if ( !this.config.display || !this.config.display.thanksLabel ) {
			$header.text( mw.message( 'mwe-upwiz-thanks-intro' ).text() );
		} else {
			$header.html( this.config.display.thanksLabel );
		}

		this.homeButton = new OO.ui.ButtonWidget( {
			label: this.getButtonConfig( 'homeButton', 'label' ) || mw.message( 'mwe-upwiz-home' ).text(),
			href: this.getButtonConfig( 'homeButton', 'target' ) || mw.config.get( 'wgArticlePath' ).replace( '$1', '' )
		} );

		this.beginButton = new OO.ui.ButtonWidget( {
			label: this.getButtonConfig( 'beginButton', 'label' ) || mw.message( 'mwe-upwiz-upload-another' ).text(),
			flags: [ 'progressive', 'primary' ]
		} );

		// TODO: make the step order configurable by campaign definitions instead of using these hacks
		beginButtonTarget = this.getButtonConfig( 'beginButton', 'target' );
		if ( !beginButtonTarget || ( beginButtonTarget === 'dropObjref' && !this.isObjectReferenceGiven() ) ) {
			this.beginButton.on( 'click', function () {
				thanks.emit( 'next-step' );
			} );
		} else {
			if ( beginButtonTarget === 'dropObjref' ) {
				beginButtonTarget = this.dropParameterFromURL( location.href, 'updateList' );
			}
			this.beginButton.setHref( beginButtonTarget );
		}
		this.beginButton.on( 'click', function () {
			mw.DestinationChecker.clearCache();
		} );

		this.buttonGroup = new OO.ui.HorizontalLayout( {
			items: [ this.homeButton, this.beginButton ]
		} );

		this.$buttons.append( this.buttonGroup.$element );
	};

	OO.inheritClass( uw.ui.Thanks, uw.ui.Step );

	/**
	 * Adds an upload to the Thanks interface.
	 *
	 * @param {mw.UploadWizardUpload} upload
	 */
	uw.ui.Thanks.prototype.addUpload = function ( upload ) {
		var thumbWikiText, $thanksDiv, $thumbnailWrapDiv, $thumbnailDiv, $thumbnailCaption, $thumbnailLink;

		thumbWikiText = '[[' + [
			upload.details.getTitle().getPrefixedText(),
			'thumb',
			upload.details.getThumbnailCaption()
		].join( '|' ) + ']]';

		$thanksDiv = $( '<div>' )
			.addClass( 'mwe-upwiz-thanks ui-helper-clearfix' );
		$thumbnailWrapDiv = $( '<div>' )
			.addClass( 'mwe-upwiz-thumbnail-side' )
			.appendTo( $thanksDiv );
		$thumbnailDiv = $( '<div>' )
			.addClass( 'mwe-upwiz-thumbnail' )
			.appendTo( $thumbnailWrapDiv );
		$thumbnailCaption = $( '<div>' )
			.css( { 'text-align': 'center', 'font-size': 'small' } )
			.appendTo( $thumbnailWrapDiv );
		$thumbnailLink = $( '<a>' )
			.text( upload.details.getTitle().getMainText() )
			.appendTo( $thumbnailCaption );

		$( '<div>' )
			.addClass( 'mwe-upwiz-data' )
			.appendTo( $thanksDiv )
			.append(
				this.makeReadOnlyInput( thumbWikiText, mw.message( 'mwe-upwiz-thanks-wikitext' ).text(), true ),
				this.makeReadOnlyInput( upload.imageinfo.descriptionurl, mw.message( 'mwe-upwiz-thanks-url' ).text() )
			);

		// This must match the CSS dimensions of .mwe-upwiz-thumbnail
		upload.getThumbnail( 120, 120 ).done( function ( thumb ) {
			mw.UploadWizard.placeThumbnail( $thumbnailDiv, thumb );
		} );

		// Set the thumbnail links so that they point to the image description page
		$thumbnailLink.add( $thumbnailDiv.find( '.mwe-upwiz-thumbnail-link' ) ).attr( {
			href: upload.imageinfo.descriptionurl,
			target: '_blank'
		} );

		this.$div.find( '.mwe-upwiz-buttons' ).before( $thanksDiv );
	};

	/**
	 * Make an mw.widgets.CopyTextLayout, which features a button
	 * to copy the text provided.
	 *
	 * @param {string} value Text it will contain
	 * @param {string} label Label
	 * @param {string} [useEditFont] Use edit font (for wikitext values)
	 * @return {jQuery}
	 */
	uw.ui.Thanks.prototype.makeReadOnlyInput = function ( value, label, useEditFont ) {
		var copyText = new mw.widgets.CopyTextLayout( {
			align: 'top',
			label: label,
			copyText: value
		} );

		if ( useEditFont ) {
			copyText.textInput.$element.addClass( 'mw-editfont-' + mw.user.options.get( 'editfont' ) );
		}

		return copyText.$element;
	};

	/**
	 * Get button configuration options from a campaign definition
	 *
	 * @param {string} buttonName name of the button as defined in campaign configuration
	 * @param {string} configField name of the button's attributes
	 * @return {Object|undefined}
	 */
	uw.ui.Thanks.prototype.getButtonConfig = function ( buttonName, configField ) {
		if ( !this.config.display || !this.config.display[ buttonName ] ) {
			return;
		}

		return this.config.display[ buttonName ][ configField ];
	};

	/**
	 * Drops a parameter from the given url
	 *
	 * @param {string} url URL from which to drop a parameter
	 * @param {string} paramName parameter to be dropped
	 * @return {string}
	 * @private
	 */
	uw.ui.Thanks.prototype.dropParameterFromURL = function ( url, paramName ) {
		var newUrl = new mw.Uri( url );
		if ( newUrl.query ) {
			delete newUrl.query[ paramName ];
			delete newUrl.query[ paramName + '[]' ];
		}
		return newUrl.toString();
	};

	uw.ui.Thanks.prototype.getDelayNotice = function () {
		var $delayNotice = $( '<p>' )
			.addClass( 'mwe-upwiz-thanks-update-delay' )
			.msg( 'mwe-upwiz-objref-notice-update-delay' );

		if ( this.config.display && this.config.display.noticeUpdateDelay ) {
			$delayNotice.html( this.config.display.noticeUpdateDelay );
		}
		return $delayNotice;
	};

	uw.ui.Thanks.prototype.isObjectReferenceGiven = function () {
		return this.config.defaults && this.config.defaults.objref !== '';
	};

}( mw.uploadWizard ) );
