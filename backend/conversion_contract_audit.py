from __future__ import annotations
import inspect
import re
from app import conversion_engine as legacy
from app.processing_quality import run_conversion
EXPECTED_RUNNER_PARAMETERS = ['spec', 'files', 'output', 'options', 'workdir', 'source_url']
TOOL_ID_RE = re.compile('^[a-z0-9]+(?:-[a-z0-9]+)*$')
SOURCE_URL_PROCESSORS = {'url_to_pdf'}

def _required_parameter_names(function) -> list[str]:
    signature = inspect.signature(function)
    return [name for name, parameter in signature.parameters.items() if parameter.kind in {parameter.POSITIONAL_ONLY, parameter.POSITIONAL_OR_KEYWORD} and parameter.default is inspect.Parameter.empty]

def main() -> None:
    if not legacy.SPECS:
        raise AssertionError('The conversion registry is empty.')
    quality_parameters = list(inspect.signature(run_conversion).parameters)
    legacy_parameters = list(inspect.signature(legacy.convert).parameters)
    if quality_parameters != EXPECTED_RUNNER_PARAMETERS:
        raise AssertionError(f'Quality runner signature drifted:{quality_parameters!r}')
    if legacy_parameters != EXPECTED_RUNNER_PARAMETERS:
        raise AssertionError(f'Legacy runner signature drifted:{legacy_parameters!r}')
    required_quality = _required_parameter_names(run_conversion)
    required_legacy = _required_parameter_names(legacy.convert)
    if required_quality[:5] != EXPECTED_RUNNER_PARAMETERS[:5]:
        raise AssertionError(f'Quality runner required parameters are invalid:{required_quality!r}')
    if required_legacy[:5] != EXPECTED_RUNNER_PARAMETERS[:5]:
        raise AssertionError(f'Legacy runner required parameters are invalid:{required_legacy!r}')
    seen_ids: set[str] = set()
    errors: list[str] = []
    for registry_id, spec in sorted(legacy.SPECS.items()):
        if registry_id in seen_ids:
            errors.append(f'duplicate registry id:{registry_id}')
        seen_ids.add(registry_id)
        if registry_id != spec.tool_id:
            errors.append(f'{registry_id}: key does not match spec.tool_id={spec.tool_id}')
        if not TOOL_ID_RE.fullmatch(registry_id):
            errors.append(f'{registry_id}: invalid public tool id')
        processor = str(spec.processor or '').strip()
        is_source_url_processor = processor in SOURCE_URL_PROCESSORS
        if not spec.input_extensions and (not is_source_url_processor):
            errors.append(f'{registry_id}: no input extensions')
        if is_source_url_processor and spec.input_extensions:
            errors.append(f'{registry_id}: source-URL processor must not require upload extensions')
        for extension in spec.input_extensions:
            if not extension.startswith('.') or extension != extension.lower():
                errors.append(f'{registry_id}: malformed input extension{extension!r}')
        if not spec.output_extension.startswith('.') or spec.output_extension != spec.output_extension.lower():
            errors.append(f'{registry_id}: malformed output extension{spec.output_extension!r}')
        if '/' not in spec.output_mime:
            errors.append(f'{registry_id}: malformed output MIME{spec.output_mime!r}')
        if not processor:
            errors.append(f'{registry_id}: empty processor')
        available, reason = legacy.tool_available(spec)
        if not isinstance(available, bool):
            errors.append(f'{registry_id}: availability probe did not return bool')
        if not available and (not str(reason or '').strip()):
            errors.append(f'{registry_id}: unavailable tool has no user-facing reason')
    if errors:
        raise AssertionError('AJN conversion contract audit failed:\n-' + '-'.join(errors))
    print(f'PASS: AJN PDF conversion contract audit —{len(legacy.SPECS)}registered tools; runner workdir/options/source_url contract stable')
if __name__ == '__main__':
    main()
