
import datetime
import pytest
from unittest.mock import MagicMock, patch
from saleor.core.utils.validators import (
    get_oembed_data,
    is_date_in_future,
    UnsupportedMediaProviderException,
    MEDIA_MAX_WIDTH,
    MEDIA_MAX_HEIGHT,
)
from saleor.product import ProductMediaTypes

class TestValidators:
    
    @patch("saleor.core.utils.validators.micawber.bootstrap_basic")
    def test_get_oembed_data_success_photo(self, mock_bootstrap):
        """Test successful retrieval of photo oembed data."""
        mock_providers = MagicMock()
        mock_bootstrap.return_value = mock_providers
        
        url = "http://example.com/photo.jpg"
        expected_data = {"type": "photo", "url": url}
        mock_providers.request.return_value = expected_data
        
        data, media_type = get_oembed_data(url)
        
        assert data == expected_data
        assert media_type == ProductMediaTypes.IMAGE
        mock_providers.request.assert_called_once_with(
            url, maxwidth=MEDIA_MAX_WIDTH, maxheight=MEDIA_MAX_HEIGHT
        )

    @patch("saleor.core.utils.validators.micawber.bootstrap_basic")
    def test_get_oembed_data_success_video(self, mock_bootstrap):
        """Test successful retrieval of video oembed data."""
        mock_providers = MagicMock()
        mock_bootstrap.return_value = mock_providers
        
        url = "http://example.com/video"
        expected_data = {"type": "video", "title": "Cool Video"}
        mock_providers.request.return_value = expected_data
        
        data, media_type = get_oembed_data(url)
        
        assert data == expected_data
        assert media_type == ProductMediaTypes.VIDEO

    @patch("saleor.core.utils.validators.micawber.bootstrap_basic")
    def test_get_oembed_data_provider_exception(self, mock_bootstrap):
        """Test that ProviderException raises UnsupportedMediaProviderException."""
        import micawber
        mock_providers = MagicMock()
        mock_bootstrap.return_value = mock_providers
        
        mock_providers.request.side_effect = micawber.exceptions.ProviderException("Error")
        
        with pytest.raises(UnsupportedMediaProviderException):
            get_oembed_data("http://bad-url.com")

    @patch("saleor.core.utils.validators.micawber.bootstrap_basic")
    def test_get_oembed_data_key_error(self, mock_bootstrap):
        """Test that unknown type (KeyError) raises UnsupportedMediaProviderException."""
        mock_providers = MagicMock()
        mock_bootstrap.return_value = mock_providers
        
        # Return data with unsupported type
        mock_providers.request.return_value = {"type": "unknown_type"}
        
        with pytest.raises(UnsupportedMediaProviderException):
            get_oembed_data("http://unknown-type.com")

    def test_is_date_in_future_true(self):
        """Test returns True for a future date."""
        future_date = datetime.datetime.now(tz=datetime.UTC).date() + datetime.timedelta(days=1)
        assert is_date_in_future(future_date) is True

    def test_is_date_in_future_false_past(self):
        """Test returns False for a past date."""
        past_date = datetime.datetime.now(tz=datetime.UTC).date() - datetime.timedelta(days=1)
        assert is_date_in_future(past_date) is False
    
    def test_is_date_in_future_false_today(self):
        """Test returns False for today (exact match depends on logic, logic is > so strictly future)."""
        today = datetime.datetime.now(tz=datetime.UTC).date()
        assert is_date_in_future(today) is False
