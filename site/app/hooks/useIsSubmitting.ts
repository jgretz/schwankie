import {useFormAction, useNavigation} from '@remix-run/react';

export function useIsSubmitting({
  formAction,
  formMethod = 'POST',
}: {
  formAction?: string;
  formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
} = {}) {
  const contextualFormAction = useFormAction();
  const navigation = useNavigation();
  return (
    navigation.state === (formMethod === 'GET' ? 'loading' : 'submitting') &&
    navigation.formAction === (formAction ?? contextualFormAction) &&
    navigation.formMethod === formMethod
  );
}
