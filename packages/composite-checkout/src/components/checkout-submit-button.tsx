/**
 * External dependencies
 */
import React, { useCallback, useState } from 'react';
import { useI18n } from '@automattic/react-i18n';

/**
 * Internal dependencies
 */
import joinClasses from '../lib/join-classes';
import { useFormStatus, FormStatus } from '../public-api';
import CheckoutErrorBoundary from './checkout-error-boundary';
import { usePaymentMethod, useProcessPayment } from '../public-api';

export default function CheckoutSubmitButton( {
	className,
	disabled,
	onLoadError,
}: {
	className?: string;
	disabled?: boolean;
	onLoadError?: ( error: string ) => void;
} ): JSX.Element | null {
	const { formStatus } = useFormStatus();
	const { __ } = useI18n();
	const isDisabled = disabled || formStatus !== FormStatus.READY;
	const processPayment = useProcessPayment();

	// processPayment may throw an error, but because it's an async function,
	// that error will not trigger any React error boundaries around this
	// component (error boundaries only catch errors that occur during render).
	// Since we want to know about processing errors, we can cause an error to
	// occur during render of this button if processPayment throws an error using
	// the below technique. See
	// https://github.com/facebook/react/issues/14981#issuecomment-468460187
	const [ , setErrorState ] = useState();
	const onClick = useCallback(
		async ( paymentMethodId, data ) => {
			return processPayment( paymentMethodId, data ).catch( ( error: Error ) => {
				setErrorState( () => {
					throw error;
				} );
			} );
		},
		[ processPayment ]
	);

	const paymentMethod = usePaymentMethod();
	if ( ! paymentMethod ) {
		return null;
	}
	const { submitButton } = paymentMethod;
	if ( ! submitButton ) {
		return null;
	}

	// We clone the element to add props
	const clonedSubmitButton = React.cloneElement( submitButton, { disabled: isDisabled, onClick } );
	return (
		<CheckoutErrorBoundary
			errorMessage={ __( 'There was a problem with the submit button.' ) }
			onError={ onLoadError }
		>
			<div className={ joinClasses( [ className, 'checkout-submit-button' ] ) }>
				{ clonedSubmitButton }
			</div>
		</CheckoutErrorBoundary>
	);
}
