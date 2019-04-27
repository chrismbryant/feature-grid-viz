**Note:** to run locally, use `python -m http.server`

---
# Feature Grid Visualization for Dimension-Reduced Data

Dimensionality reduction algorithms such as UMAP, t-SNE, PCA, etc. provide a convenient way to view the approximate structure of a high-dimensional dataset on a flat 2D surface, but the resulting plot can be difficult to interpret. One way to qualitatively understand how the dataset's original features correspond to its overall structure is to color the reduced-dimension plot according to the value of each data point at only a single feature. By doing this one feature at a time, we can often illuminate patterns relating individual features to overall structure. When our original dataset has a moderate number of features (between 10 and 100, for example), it can be helpful to show a whole grid of plots, each colored according to a different feature.

Here, we offer an in-browser solution for performing a feature grid visualization of a dimension-reduced dataset. Simply interact with the UI after uploading your data as a JSON file in the following format:
```
{
  "data": [[1.01, 0.11, ..., 2.87], ..., [0.99, ..., 3.62]],
  "data_2d": [[2.10, 0.03], ..., [1.24, 6.33]],
  "labels": [1, 0, 1, ... , 1, 0],
  "label_type": "binary",
  "data_tags": ["Chris", "Michiel", ..., "Vahid"]
  "features_names": ["f00", "f02", ... , "f23"],
}
```
### JSON Fields
* `data`: a list of the N-dimensional vectors representing each point in the original N-dimensional dataset.
* `data_2d`: a list of the [x, y] coordinates of each point in the dimension-reduced (2D) dataset.
* `labels` (_optional_): a list of binary, integer-valued, or real-valued 1D labels corresponding to each point in the dataset. Will be ignored if not provided.
* `label_type` (_optional_) - "binary", "categorical", or "real": a descriptor string indicating whether the supplied labels should be interpreted as booleans ("binary"), integers ("categorical"), or floats ("real"). Will default to "real" if `labels` is provided but `label_type` is not.
* `data_tags` (_optional_): a list of additional attributes that are associated with each data point. Will be ignored if not provided.
* `features_names` (_optional_): a list of feature names used to refer to each of the original dataset's features. Will default to ["f00", "f02", ...] if not provided.

Note that `data_2D` and `data` are the only required parameters in this file.

### UI Controls 
_NOT FULLY IMPLEMENTED YET_
* **Scroll wheel** | **`=` and `-`**: Scroll up/down or press `=`/`-` to increase/decrease the magnification strength (i.e. zoom in/out).
* **Mouse** | **Arrow Keys** | **`WASD`**: Move the mouse or use the arrow keys (or `W`, `A`, `S`, and `D` keys) to move the center of magnification. The amount that the center of magnification moves is inversely proportional to the current magnification strength.
* **`X` and `Z`**: Press `X`/`Z` to increase/decrease the magnification configuration sensitivity to keyboard inputs. A lower sensitivity means, for instance, that each press of the right arrow key moves the magnification center a smaller distance than it would with a higher sensitivity.
* **Left-click** | **Space bar**: Left-click or press the space bar to freeze/unfreeze the magnifier configuration (center and strength). When the configuration is frozen, it cannot be changed by mouse inputs, but it can still be changed by keyboard inputs.
* **Click button??** | **Enter**: Save images. Multiple check boxes to specify what images to save (full grid of feature cells, label cell, bounding box thumbnail), what size to save them at (large, small, both), what directory to save them in.
* **`tab`**: Press the `tab` key to toggle between feature grid mode and single feature mode. When in single feature mode, use the right/left arrow keys to switch to the next/previous feature, or type the desired feature index into the `feature_index` text box and press "Go".

### Future UI
* **Drag and drop**: Drag and drop data file onto screen.

### References
* Magnifier: http://mark-rolich.github.io/Magnifier.js/
* Structuring, Grouping, and Referencing in SVG: https://www.sarasoueidan.com/blog/structuring-grouping-referencing-in-svg/
* SVG - Planning for Performance: https://oreillymedia.github.io/Using_SVG/extras/ch19-performance.html
